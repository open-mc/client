# Client
```sh
git clone https://github.com/open-mc/client
cd client
npx static-server -z -p 80 -c "*"
```

<details>
<summary>Explanation</summary>

`git clone https://github.com/open-mc/client` - Clone this repository into a local folder (download the client) using the popular version control system `git`.

`cd client` - Change directory to this new folder.

`npx static-server -z -p 80 -c "*"` - Start a static HTTP server to make the folder's content available on http://localhost.
- `-z` disables caching so file changes are available immediately.
- `-p 80` specifies port 80 which is the default for HTTP
- `-c "*"` adds required HTTP header for the client to function properly
</details>

Note: Client does not currently support singleplayer (coming soon!), get the server software over at https://github.com/open-mc/server