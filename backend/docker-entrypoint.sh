#!/bin/bash
set -e

echo "🚀 Starting IntelliConvo Backend..."

# Wait for PostgreSQL to be ready
if [ -n "$DATABASE_URL" ]; then
    echo "⏳ Waiting for PostgreSQL..."

    # Extract host and port from DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    DB_HOST=$(echo $DATABASE_URL | sed -E 's/.*@([^:]+):.*/\1/')
    DB_PORT=$(echo $DATABASE_URL | sed -E 's/.*:([0-9]+)\/.*/\1/')

    # Default port if not specified
    DB_PORT=${DB_PORT:-5432}

    # Wait for database
    max_retries=30
    counter=0
    until wget -q --spider "http://${DB_HOST}:${DB_PORT}" 2>/dev/null || nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
        counter=$((counter + 1))
        if [ $counter -ge $max_retries ]; then
            echo "⚠️  Could not verify PostgreSQL connection, proceeding anyway..."
            break
        fi
        echo "⏳ Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}... ($counter/$max_retries)"
        sleep 2
    done

    echo "✅ PostgreSQL is available"
fi

# Wait for Redis to be ready
if [ -n "$REDIS_HOST" ]; then
    echo "⏳ Waiting for Redis..."

    max_retries=30
    counter=0
    until nc -z "$REDIS_HOST" "${REDIS_PORT:-6379}" 2>/dev/null; do
        counter=$((counter + 1))
        if [ $counter -ge $max_retries ]; then
            echo "⚠️  Could not verify Redis connection, proceeding anyway..."
            break
        fi
        echo "⏳ Waiting for Redis at ${REDIS_HOST}:${REDIS_PORT:-6379}... ($counter/$max_retries)"
        sleep 2
    done

    echo "✅ Redis is available"
fi

# Run database migrations and seed
if [ "$RUN_MIGRATIONS" = "true" ] || [ "$RUN_MIGRATIONS" = "1" ]; then
    echo "📦 Running Prisma migrations..."
    npx prisma db push --skip-generate

    if [ "$RUN_SEED" = "true" ] || [ "$RUN_SEED" = "1" ]; then
        echo "🌱 Running database seed..."
        npx prisma db seed || echo "⚠️  Seed may have already run, continuing..."
    fi
fi

echo "🎉 Backend initialization complete!"

# Execute the main command
exec "$@"
