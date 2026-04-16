const fs = require('fs');
const files = ['src/pages/HomePage.tsx', 'src/pages/AboutPage.tsx', 'src/pages/ContactPage.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<Grid item xs={(\d+)}(?: sm={(\d+)})?(?: md={(\d+)})?([^>]*)>/g, (match, xs, sm, md, rest) => {
    let sizeParts = [];
    if (xs) sizeParts.push(`xs: ${xs}`);
    if (sm) sizeParts.push(`sm: ${sm}`);
    if (md) sizeParts.push(`md: ${md}`);
    return `<Grid size={{ ${sizeParts.join(', ')} }}${rest}>`;
  });
  content = content.replace(/<Grid item xs={(\d+)}(?: sm={(\d+)})?(?: md={(\d+)})?/g, (match, xs, sm, md) => {
    let sizeParts = [];
    if (xs) sizeParts.push(`xs: ${xs}`);
    if (sm) sizeParts.push(`sm: ${sm}`);
    if (md) sizeParts.push(`md: ${md}`);
    return `<Grid size={{ ${sizeParts.join(', ')} }}`;
  });
  fs.writeFileSync(file, content);
});
console.log('Fixed Grids!');
