function replaceTitleBlackList (title: string, blackList: string): string {
    let newTitle: string = title
    for (const line of blackList.split('\n')) {
      const isRegExp = line.match(/^\/(.+)\/([ig]*)$/)
      if (isRegExp) {
        const exp = isRegExp[1]
        const flag = isRegExp[2]
        newTitle = newTitle.replace(new RegExp(exp, flag), '')
      } else {
        newTitle = newTitle.replace(new RegExp(line, 'g'), '')
      }
    }
    return newTitle
  }

  function escapeHtmlEntities (str: string) {
    return (
      str
        // Escape backslash escapes!
        .replace(/\\(\S)/g, "\\\\$1")

        // Escape headings
        .replace(/^(#{1,6} )/gm, "\\$1")

        // Escape hr
        .replace(/^([-*_] *){3,}$/gm, function (match, character) {
          return match.split(character).join("\\" + character);
        })

        // Escape ol bullet points
        .replace(/^(\W* {0,3})(\d+)\. /gm, "$1$2\\. ")

        // Escape ul bullet points
        .replace(/^([^\\\w]*)[*+-] /gm, function (match) {
          return match.replace(/([*+-])/g, "\\$1");
        })

        // Escape blockquote indents
        .replace(/^(\W* {0,3})> /gm, "$1\\> ")

        // Escape em/strong *
        .replace(/\*+(?![*\s\W]).+?\*+/g, function (match) {
          return match.replace(/\*/g, "\\*");
        })

        // Escape em/strong _
        .replace(/_+(?![_\s\W]).+?_+/g, function (match) {
          return match.replace(/_/g, "\\_");
        })

        // Escape code _
        .replace(/`+(?![`\s\W]).+?`+/g, function (match) {
          return match.replace(/`/g, "\\`");
        })

        // Escape link brackets
        .replace(/[\[\]]/g, "\\$&")

        // Replace angle brackets
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
    );
  };