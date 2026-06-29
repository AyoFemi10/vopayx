web: sh -c "if [ \"$PROJECT\" = \"api\" ]; then npm run start --workspace=apps/api; else npm run start --workspace=apps/web; fi"
release: sh -c "if [ \"$PROJECT\" = \"api\" ]; then npm run db:deploy --workspace=packages/db; fi"
