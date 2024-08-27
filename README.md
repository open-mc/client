# Client
```sh
git clone --recurse-submodules https://github.com/open-mc/client
cd client
npx static-server -p 80 -c "*" -z
```

<details>
<summary>Explanation</summary>

`git clone --recurse-submodules https://github.com/open-mc/client` - Clone this repository into a local folder (download the client) using the popular version control system `git`.

`cd client` - Change directory to this new folder.

`npx static-server -p 80 -z` - Start a static HTTP server to make the folder's content available on http://localhost.
- `-p 80` specifies port 80 which is the default for HTTP
- `-z` disables caching so file changes are available immediately.
</details>

For multiplayer, get the server software over at https://github.com/open-mc/server