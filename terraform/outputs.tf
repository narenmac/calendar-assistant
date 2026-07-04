output "frontend_url" {
  description = "Public URL of the frontend"
  value       = "https://${azurerm_container_app.frontend.ingress[0].fqdn}"
}

output "backend_url" {
  description = "Public URL of the backend (add to Google OAuth redirect URIs)"
  value       = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
}
