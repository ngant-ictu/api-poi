# POI GraphQL API

`query {
	getUsers(
		opts: {
			curPage: 1,
			perPage: 30,
			q: "",
			sort: "-dateCreated",
			group: 2
		}
	) {
		users {
			id,
			email,
			fullName
		},
		meta {
			curPage,
			perPage,
			totalPages,
			totalResults
		}
	}
}`

`query {
	login(
		input: {
			userName: "admin@localhost.local",
			password: "12"
		}
	) {
		user,
		token
	}
}`

`mutation {
	createUser(
		input: {
			email: "alibaba@localhost.local",
			password: "1",
			fullName: "Alibaba",
			isSuperUser: 1,
			isStaff: 3,
			status: 3,
			isVerified: 3,
			verifyType: 1,
			isProfileUpdated: 3,
			groups: [1]
		}
	) {
		id,
		fullName
	}
}
`

# Upload file with GraphQL example curl

`
	curl localhost:9000/graphql \
	-F operations='{ "query": "mutation ($file: Upload!) { singleUpload(file: $file) { id } }", "variables": { "file": null } }' \
	-F map='{ "0": ["variables.file"] }' \ -F 0=@prosody.txt

`

# Mysql to Elasticsearch

- Enable mysql binlog
- Using golang to sync mysql to elasticsearch (automatic)
	- `go-mysql-elasticsearch -config=river.toml`

# SQL migration

- go get -v github.com/rubenv/sql-migrate/...
- sql-migrate up --help

# Format ts file using prettier config

- prettier --config ./.prettierrc --write "src/**/*.ts"
