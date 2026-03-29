const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads');

console.log('📁 Checking uploads folder...');

try {
  const files = fs.readdirSync(uploadsDir);
  
  const videoFiles = files.filter(f => /\.(mp4|mov|webm|mkv)$/i.test(f));
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  
  console.log(`\n📊 Upload Statistics:`);
  console.log(`Total files: ${files.length}`);
  console.log(`Image files: ${imageFiles.length}`);
  console.log(`Video files: ${videoFiles.length}`);
  
  if (videoFiles.length > 0) {
    console.log('\n🎥 Recent Video Files:');
    videoFiles
      .sort((a, b) => {
        const statA = fs.statSync(path.join(uploadsDir, a));
        const statB = fs.statSync(path.join(uploadsDir, b));
        return statB.mtime - statA.mtime;
      })
      .slice(0, 10)
      .forEach(f => {
        const stat = fs.statSync(path.join(uploadsDir, f));
        console.log(`  - ${f} (${(stat.size / 1024 / 1024).toFixed(2)} MB, ${stat.mtime.toISOString()})`);
      });
  } else {
    console.log('\n❌ No video files found in uploads!');
  }

} catch (error) {
  console.error('Error reading uploads folder:', error);
}