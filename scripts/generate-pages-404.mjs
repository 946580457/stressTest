import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const docsDir = join(process.cwd(), "docs");
const indexPath = join(docsDir, "index.html");
const notFoundPath = join(docsDir, "404.html");

const redirectScript = `    <script>
      (function () {
        var pathSegmentsToKeep = 1;
        var pathname = window.location.pathname;
        var search = window.location.search;
        var hash = window.location.hash;
        var basePath = pathname.split("/").slice(0, 1 + pathSegmentsToKeep).join("/");
        var routePath = pathname.slice(basePath.length) || "/";
        var query = search ? "&q=" + search.slice(1).replace(/&/g, "~and~") : "";

        window.location.replace(
          window.location.origin +
            basePath +
            "/?p=" +
            encodeURIComponent(routePath + hash) +
            query
        );
      })();
    </script>`;

const indexHtml = await readFile(indexPath, "utf8");
const notFoundHtml = indexHtml.replace("</head>", `${redirectScript}\n  </head>`);

await writeFile(notFoundPath, notFoundHtml, "utf8");
