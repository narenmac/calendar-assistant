terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = "d3044c18-8d79-4491-9d72-9602400ad704"
}

# ── Resource Group ────────────────────────────────────────────────────────────

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
}

# ── Azure Container Registry ──────────────────────────────────────────────────

resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true
}

# ── Log Analytics (required by Container Apps) ────────────────────────────────

resource "azurerm_log_analytics_workspace" "main" {
  name                = "calendar-assistant-logs"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# ── Container Apps Environment ────────────────────────────────────────────────

resource "azurerm_container_app_environment" "main" {
  name                       = "calendar-assistant-env"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
}

# ── gcal-mcp (internal — only reachable by backend inside the environment) ────

resource "azurerm_container_app" "gcal_mcp" {
  name                         = "gcal-mcp"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  template {
    min_replicas = 1
    max_replicas = 1

    container {
      name   = "gcal-mcp"
      image  = "naren433/cal-gcal-mcp:latest"
      cpu    = 0.5
      memory = "1Gi"
    }
  }

  ingress {
    external_enabled = false   # internal only
    target_port      = 8090
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

# ── Backend ───────────────────────────────────────────────────────────────────

resource "azurerm_container_app" "backend" {
  name                         = "backend"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  secret {
    name  = "groq-api-key"
    value = var.groq_api_key
  }

  template {
    min_replicas = 1
    max_replicas = 2

    container {
      name   = "backend"
      image  = "naren433/cal-backend:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name        = "GROQ_API_KEY"
        secret_name = "groq-api-key"
      }

      env {
        name  = "GCAL_MCP_URL"
        value = "http://gcal-mcp"
      }
    }
  }

  ingress {
    external_enabled = true
    target_port      = 8080
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

# ── Frontend ──────────────────────────────────────────────────────────────────

resource "azurerm_container_app" "frontend" {
  name                         = "frontend"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  template {
    min_replicas = 1
    max_replicas = 2

    container {
      name   = "frontend"
      image  = "naren433/cal-frontend:latest"
      cpu    = 0.25
      memory = "0.5Gi"
    }
  }

  ingress {
    external_enabled = true
    target_port      = 80
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}
