export const compressImageToWebP = (file, maxWidth = 1200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Simple client-side edge/blur detection simulation 
        // In a full production build, we would use OpenCV WASM here
        // For now, we assume if the image is incredibly small, it might be bad
        if (width < 300) {
          console.warn("Image might be too small or blurry");
        }

        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrl.split(',')[1]); // return base64 part
      };
      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
