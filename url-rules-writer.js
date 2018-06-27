this.urlRules = (ngPaths) => {
    let content = '<?xml version="1.0" encoding="utf-8"?> ';
    const done = [];
    content += '<!DOCTYPE urlrewrite PUBLIC "-//tuckey.org//DTD UrlRewrite 4.0//EN" ';
    content += '"http://www.tuckey.org/res/dtds/urlrewrite4.0.dtd"> ';

    content += '<!-- Configuration file for UrlRewriteFilter http://www.tuckey.org/urlrewrite/ --> ';
    content += '<urlrewrite> ';
    if (ngPaths != null && ngPaths.length !== 0) {
        ngPaths.forEach(path => {
            let trimmedPath = path.trim();
            if (trimmedPath.indexOf('/') !== -1) {
                trimmedPath = trimmedPath.substring(0, trimmedPath.indexOf('/'));
            }
            if ('**' !== trimmedPath && done.indexOf(trimmedPath) === -1) {
                let currentPath = trimmedPath;
                done.push(trimmedPath);

                currentPath = '/' + currentPath;

                content += '<rule> ';
                    content += `<from>${currentPath}</from> `;
                    content += '<to type="forward">/index.html?</to> ';
                content += '</rule> ';
            }
        });
    }
    content += '</urlrewrite> ';
    return content;
}