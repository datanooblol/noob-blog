@echo off
echo Starting DynamoDB Local...

REM Create data directory
if not exist "docker\dynamodb" mkdir docker\dynamodb

REM Download DynamoDB Local if not exists
if not exist "dynamodb-local.jar" (
    echo Downloading DynamoDB Local...
    curl -L -o dynamodb-local.zip https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.zip
    powershell -command "Expand-Archive -Path dynamodb-local.zip -DestinationPath ."
    del dynamodb-local.zip
)

REM Start DynamoDB Local
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -dbPath ./docker/dynamodb -port 8000

pause