[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";C:\Users\princ\.local\bin", "User")

where.exe fcc-claude