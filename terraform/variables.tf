variable "location" {
  description = "Azure region"
  default     = "eastus"
}

variable "resource_group_name" {
  description = "Resource group name"
  default     = "calendar-assistant-rg"
}

variable "acr_name" {
  description = "Azure Container Registry name (must be globally unique, alphanumeric only)"
  default     = "calendarassistantacr"
}

variable "groq_api_key" {
  description = "Groq API key for the backend LLM"
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth 2.0 client ID"
}
