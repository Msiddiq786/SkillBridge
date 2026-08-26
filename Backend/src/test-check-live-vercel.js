const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

console.log('Fetching live Vercel index.html...');

https.get('https://studentskillhub.vercel.app', { agent }, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log('Live HTTP Status:', res.statusCode);
        const scriptTags = body.match(/<script[^>]*>/g);
        console.log('Script tags on live Vercel:');
        console.log(scriptTags);
    });
}).on('error', (e) => {
    console.error('Error fetching Vercel:', e.message);
});
