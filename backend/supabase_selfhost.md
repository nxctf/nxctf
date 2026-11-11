NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<YOUR_SUPABASE_PUBLISHABLE_KEY>
NEXT_PUBLIC_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co


NEXT_PUBLIC_TURNSTILE_SITE_KEY=<YOUR_TURNSTILE_SITE_KEY>
NEXT_PUBLIC_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<YOUR_SUPABASE_PUBLISHABLE_KEY>




git clone --depth 1 --branch self-hosted/v0.8.3 https://github.com/supabase/supabase
mkdir supabase-project
cp -rf supabase/docker/. supabase-project
cd supabase-project
cp .env.example .env
printf 'ref=self-hosted/v0.8.3\n' > .supabase-version

sh utils/generate-keys.sh --update-env
sh utils/add-new-auth-keys.sh --update-env

SUPABASE_PUBLIC_URL=https://api.domainlo.com
API_EXTERNAL_URL=https://api.domainlo.com
SITE_URL=https://app.domainlo.com

ENABLE_EMAIL_AUTOCONFIRM=true
ENABLE_PHONE_SIGNUP=false
SUPABASE_PUBLIC_URL=https://api.nxctf.my.id
API_EXTERNAL_URL=https://api.nxctf.my.id/auth/v1
SITE_URL=https://<url-frontend-lo>
POOLER_PROXY_PORT_TRANSACTION=127.0.0.1:6543


cloudflare


curl https://api.nxctf.my.id/rest/v1/ -H "apikey: <SUPABASE_PUBLISHABLE_KEY>"


KEY=$(grep '^SUPABASE_PUBLISHABLE_KEY=' .env | cut -d= -f2)
curl https://api.nxctf.my.id/auth/v1/settings -H "apikey: $KEY"
SKEY=$(grep '^SUPABASE_SECRET_KEY=' .env | cut -d= -f2)
curl https://api.nxctf.my.id/rest/v1/ -H "apikey: $SKEY"


postgresql://postgres.<YOUR_PROJECT_REF>:<YOUR_DB_PASSWORD>@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres


read -rs OLD_DB_URL
npx supabase db dump --remote="$OLD_DB_URL" -f roles.sql --role-only
npx supabase db dump --remote="$OLD_DB_URL" -f schema.sql
npx supabase db dump --remote="$OLD_DB_URL" -f data.sql --use-copy --data-only








DISABLE_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
ENABLE_PHONE_SIGNUP=false
ENABLE_PHONE_AUTOCONFIRM=false
SUPABASE_PUBLIC_URL=https://api.nxctf.my.id
API_EXTERNAL_URL=https://api.nxctf.my.id/auth/v1
SITE_URL=https://api.nxctf.my.id
API_GW_HTTP_PORT=127.0.0.1:6060
POOLER_PROXY_PORT_TRANSACTION=127.0.0.1:6543



cp .env.example .env
sh utils/generate-keys.sh --update-env
sh utils/add-new-auth-keys.sh --update-env


set_env() { sed -i "s|^$1=.*|$1=$2|" .env; }
set_env DISABLE_SIGNUP true
set_env ENABLE_EMAIL_AUTOCONFIRM true
set_env ENABLE_PHONE_SIGNUP false
set_env ENABLE_PHONE_AUTOCONFIRM false
set_env SUPABASE_PUBLIC_URL https://api.nxctf.my.id
set_env API_EXTERNAL_URL https://api.nxctf.my.id/auth/v1
set_env SITE_URL https://api.nxctf.my.id
set_env API_GW_HTTP_PORT 0.0.0.0:6060
set_env POOLER_PROXY_PORT_TRANSACTION 127.0.0.1:6543


grep -E '^(DISABLE_SIGNUP|SUPABASE_PUBLIC_URL|API_EXTERNAL_URL|SITE_URL|API_GW_HTTP_PORT|POOLER_PROXY_PORT_TRANSACTION)=' .env
grep -E '^(POSTGRES_PASSWORD|JWT_SECRET|SUPABASE_SECRET_KEY)=' .env | sed 's/=.*/=(terisi)/'
grep -E '^(ENABLE_EMAIL_AUTOCONFIRM|ENABLE_PHONE_SIGNUP|ENABLE_PHONE_AUTOCONFIRM)=' .env



docker compose down -v
sudo rm -rf volumes/db/data
docker compose up -d --wait
docker compose ps


psql --version || sudo apt install -y postgresql-client










export PGPASSWORD=$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2)
TENANT=$(grep '^POOLER_TENANT_ID=' .env | cut -d= -f2)

psql \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "postgres://postgres.$TENANT@localhost:5432/postgres" \
  2> restore-errors.log

wc -l restore-errors.log








cat .env | grep SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<YOUR_TURNSTILE_SITE_KEY>
