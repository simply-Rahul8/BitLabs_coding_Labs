$DOCKER_USERNAME = "rahul720"
$BACKEND_IMAGE  = "$DOCKER_USERNAME/bitlabs-coding-lab-backend:latest"
$FRONTEND_IMAGE = "$DOCKER_USERNAME/bitlabs-coding-lab-frontend:latest"

Write-Host "Logging in to DockerHub..." -ForegroundColor Cyan
docker login

Write-Host "Building backend image..." -ForegroundColor Cyan
docker build -t $BACKEND_IMAGE ./backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build failed." -ForegroundColor Red; exit 1
}

Write-Host "Building frontend image..." -ForegroundColor Cyan
docker build -t $FRONTEND_IMAGE ./frontend
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed." -ForegroundColor Red; exit 1
}

Write-Host "Pushing backend to DockerHub..." -ForegroundColor Cyan
docker push $BACKEND_IMAGE
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend push failed." -ForegroundColor Red; exit 1
}

Write-Host "Pushing frontend to DockerHub..." -ForegroundColor Cyan
docker push $FRONTEND_IMAGE
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend push failed." -ForegroundColor Red; exit 1
}

Write-Host ""
Write-Host "Done! Images pushed successfully." -ForegroundColor Green
Write-Host "Backend:  $BACKEND_IMAGE" -ForegroundColor White
Write-Host "Frontend: $FRONTEND_IMAGE" -ForegroundColor White
