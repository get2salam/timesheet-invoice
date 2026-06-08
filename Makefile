.PHONY: dev build start lint type-check test test-watch verify docker-build docker-run docker-compose-up clean

dev:
	npm run dev

build:
	npm run build

start:
	npm start

lint:
	npm run lint

type-check:
	npm run typecheck

test:
	npm test

test-watch:
	npm run test:watch

verify:
	npm run verify

docker-build:
	docker build -t timesheet-invoice .

docker-run:
	docker run -p 3000:3000 timesheet-invoice

docker-compose-up:
	docker compose up --build -d

clean:
	rm -rf .next node_modules
