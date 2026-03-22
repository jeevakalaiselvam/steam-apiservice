aws ecs list-tasks \
  --cluster steam-achievements \
  --service-name steam-achievements-service \
  --desired-status STOPPED \
  --query "taskArns[0]" --output text