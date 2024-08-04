# Define variables

$directoryA = "C:\GenMatter\matter-manager-backend"
$directoryB = "C:\GenMatter\matter-manager-frontend"

$sitePathA = "C:\GenMatter\matter-manager-backend\dist"
$proxyDestinationA = "http://localhost:3000"
$genMatterServiceName = "GenMatter"

 

# Function to perform git pull and npm build

function GitPullAndNpmBuild {

    param (
        [string]$directory
    )

    Write-Host "Processing directory: $directory"
    Set-Location -Path $directory

    try {
        git pull
        if ($LASTEXITCODE -ne 0) {
            throw "Git pull failed in directory $directory"
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
        return
    }

    npm install

    try {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "npm run build failed in directory $directory"
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
        return
    }

}

 
# Function to create a proxy using URL Rewrite in IIS

function CreateProxy {
    param (
        [string]$sitePath,
        [string]$proxyDestination
    )

    Write-Host "Creating proxy for site path: $sitePath"

    # Create web.config with URL Rewrite rules
    $webConfigPath = "$sitePath\web.config"

    # Define URL Rewrite rules
    $rewriteRules = @"

<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name='ReverseProxyInboundRule' stopProcessing='true'>
                    <match url='(.*)' />
                    <action type='Rewrite' url='$proxyDestination/{R:1}' />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
"@

    try {
        # Create or overwrite web.config
        $rewriteRules | Out-File -FilePath $webConfigPath -Encoding UTF8
        Write-Host "web.config created at $webConfigPath"
    } catch {
        Write-Host "Error writing web.config: $($_.Exception.Message)"
        return
    }

    try {
        # Restart the IIS site to apply changes
        Restart-WebAppPool -Name GenMatter
        iisreset
        Write-Host "IIS reset successfully."
    } catch {
        Write-Host "Error restarting IIS: $($_.Exception.Message)"
    }

}

function StopSeriverce {
    param (
        [string]$serviceName
    )

    try {
        if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
            throw "pm2 is not installed nothing to stop"
        }
    } catch {
        Write-Host "$($_.Exception.Message)"
        return
    }

    try {
        Write-Host "Stopping GenMatter service"
        pm2 infmo $serviceName
        pm2 stop $serviceName
        pm2 delete $serviceName
        pm2 list
        if ($LASTEXITCODE -ne 0) {
            throw "pm2 stop GenMatter failed"
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
        return
    }
}

function InstallPm2AndStart {
    param (
        [string]$directory,
        [string]$serviceName
    )

    try {
        if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
            Write-Host "PM2 not installer, installing now"
            npm install pm2 -g
            if ($LASTEXITCODE -ne 0) {
                throw "npm install pm2 -g failed in directory $directory"
            }
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
        return
    }

    try {
        if (-not (Get-Command pm2-startup -ErrorAction SilentlyContinue)) {
            Write-Host "pm2-windows-startup not installed, installing now"
            npm install pm2-windows-startup -g
            pm2-startup install
            if ($LASTEXITCODE -ne 0) {
                throw "npm install pm2-windows-startup -g failed in directory $directory"
            }
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
        return
    }
    try {
         pm2 start $directory\src\main.js --name "$serviceName" --watch
        if ($LASTEXITCODE -ne 0) {
            throw " pm2 start $directory\src\main.js --name $serviceName --watch failed in directory $directory"
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
        return
    }
    try {
         pm2 save
        if ($LASTEXITCODE -ne 0) {
            throw " pm2 start $directory\dist\main.js --name $serviceName --watch failed in directory $directory"
        }
    } catch {
        Write-Host "Error: $($_.Exception.Message)"
        return
    }
    
}

function InstallGenMatter {
    param (
        [string]$serviceName,
        [string]$directoryA,
        [string]$directoryB,
        [string]$sitePath,
        [string]$proxyDestination
    )
    # Main script execution
    # Stop the service on pm2 if it installed
    StopSeriverce -serviceName $serviceName

    # Step 2: Git pull and npm build for directory A
    GitPullAndNpmBuild -directory $directoryA

    # Step 3: Git pull and npm build for directory B
    GitPullAndNpmBuild -directory $directoryB
    Set-Location -Path $directoryA\support

    # Step 4: Install pm2 and start the service
    InstallPm2AndStart -directory $sitePath -serviceName $serviceName

    # Step 4: Create proxy for Site A
    CreateProxy -sitePath $sitePath -proxyDestination $proxyDestination
    Write-Host "Script execution completed."
}

function Show-Menu {
    Clear-Host
    Write-Host "===================================="
    Write-Host "          Select an option          "
    Write-Host "===================================="
    Write-Host "1: Install/Update GenMAtter"
    Write-Host "2: Start Service"
    Write-Host "3: Stop Service"
    Write-Host "4: Log Service"
    Write-Host "5: Exit"
}

function Handle-Choice {
    param (
        [int]$choice,
        [string]$serviceName,
        [string]$directoryA,
        [string]$directoryB,
        [string]$sitePath,
        [string]$proxyDestination
    )

    switch ($choice) {
        1 { 
            InstallGenMatter -serviceName $serviceName -directoryA $directoryA -directoryB $directoryB -sitePath $sitePath -proxyDestination $proxyDestination
         }
        2 { 
            InstallPm2AndStart -directory $sitePath -serviceName $serviceName
         }
        3 {
            StopSeriverce -serviceName $serviceName
        }
        4 {
            pm2 logs $serviceName
        }
        default { Write-Host "Saliendo..." }
    }
}

# Pause function definition
function Pause {
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Main script logic
$choice = 0
Show-Menu
[int]$choice = Read-Host "Select one options"
Handle-Choice -choice $choice -serviceName $genMatterServiceName -directoryA $directoryA -directoryB $directoryB -sitePath $sitePathA -proxyDestination $proxyDestinationA
Pause # Pauses the script so the user can see the output before clearing the screen



# # Main script execution
# # Stop the service on pm2 if it installed
# StopSeriverce -serviceName $genMatterServiceName

# # Step 2: Git pull and npm build for directory A
# GitPullAndNpmBuild -directory $directoryA

# # Step 3: Git pull and npm build for directory B
# GitPullAndNpmBuild -directory $directoryB
# Set-Location -Path $directoryA\support

# # Step 4: Install pm2 and start the service
# InstallPm2AndStart -directory $sitePathA -serviceName $genMatterServiceName

# # Step 4: Create proxy for Site A
# CreateProxy -sitePath $sitePathA -proxyDestination $proxyDestinationA
# Write-Host "Script execution completed."