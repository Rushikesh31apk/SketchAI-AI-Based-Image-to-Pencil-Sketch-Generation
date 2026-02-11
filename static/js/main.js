/**
 * SketchAI - Main JavaScript
 * Handles all interactive features and animations
 */

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    
    // ========================================
    // Navigation Scroll Effect
    // ========================================
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(15, 23, 42, 0.98)';
        } else {
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
        }
    });
    
    
    // ========================================
    // File Upload Handling
    // ========================================
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const uploadPreview = document.getElementById('uploadPreview');
    const previewImage = document.getElementById('previewImage');
    const fileName = document.getElementById('fileName');
    const removeFile = document.getElementById('removeFile');
    const uploadForm = document.getElementById('uploadForm');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    if (fileInput && uploadArea) {
        // Click to upload
        uploadArea.addEventListener('click', function() {
            fileInput.click();
        });
        
        // File selection handler
        fileInput.addEventListener('change', function() {
            handleFileSelect(this.files[0]);
        });
        
        // Drag and drop handlers
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleFileSelect(files[0]);
            }
        });
        
        // Remove file handler
        if (removeFile) {
            removeFile.addEventListener('click', function(e) {
                e.stopPropagation();
                resetFileUpload();
            });
        }
        
        // Form submission handler
        if (uploadForm) {
            uploadForm.addEventListener('submit', function(e) {
                if (!fileInput.files || fileInput.files.length === 0) {
                    e.preventDefault();
                    alert('Please select an image file');
                    return false;
                }
                
                // Show loading overlay
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'flex';
                }
            });
        }
    }
    
    
    // ========================================
    // File Selection Handler
    // ========================================
    function handleFileSelect(file) {
        if (!file) return;
        
        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp', 'image/tiff', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('Invalid file type. Please select an image file (PNG, JPG, JPEG, BMP, TIFF, WebP)');
            resetFileUpload();
            return;
        }
        
        // Validate file size (16MB)
        const maxSize = 16 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('File is too large. Maximum size is 16MB.');
            resetFileUpload();
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            if (previewImage && fileName && uploadPlaceholder && uploadPreview) {
                previewImage.src = e.target.result;
                fileName.textContent = file.name;
                uploadPlaceholder.style.display = 'none';
                uploadPreview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }
    
    
    // ========================================
    // Reset File Upload
    // ========================================
    function resetFileUpload() {
        if (fileInput) {
            fileInput.value = '';
        }
        if (uploadPlaceholder && uploadPreview) {
            uploadPlaceholder.style.display = 'block';
            uploadPreview.style.display = 'none';
        }
        if (previewImage) {
            previewImage.src = '';
        }
        if (fileName) {
            fileName.textContent = '';
        }
    }
    
    
    // ========================================
    // Smooth Scroll for Anchor Links
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    
    // ========================================
    // Animate Elements on Scroll
    // ========================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements with animation
    const animateElements = document.querySelectorAll('.feature-card, .process-card, .tech-step, .info-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    
    // ========================================
    // Auto-dismiss Alerts
    // ========================================
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
    
    
    // ========================================
    // Image Comparison on Result Page
    // ========================================
    const resultImages = document.querySelectorAll('.result-image');
    resultImages.forEach(img => {
        img.addEventListener('click', function() {
            // Create modal for full-screen view
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                cursor: pointer;
                padding: 2rem;
            `;
            
            const fullImg = document.createElement('img');
            fullImg.src = this.src;
            fullImg.style.cssText = `
                max-width: 90%;
                max-height: 90%;
                border-radius: 10px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            `;
            
            modal.appendChild(fullImg);
            document.body.appendChild(modal);
            
            modal.addEventListener('click', function() {
                document.body.removeChild(modal);
            });
        });
    });
    
    
    // ========================================
    // Loading Animation Progress
    // ========================================
    if (loadingOverlay) {
        const progressBar = loadingOverlay.querySelector('.progress-bar');
        if (progressBar) {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 90) progress = 90;
                progressBar.style.width = progress + '%';
            }, 300);
        }
    }
    
    
    // ========================================
    // Prevent Double Form Submission
    // ========================================
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                setTimeout(() => {
                    submitBtn.disabled = false;
                }, 3000);
            }
        });
    });
    
    
    // ========================================
    // Easter Egg: Konami Code
    // ========================================
    let konamiCode = [];
    const konamiPattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    
    document.addEventListener('keydown', function(e) {
        konamiCode.push(e.key);
        konamiCode = konamiCode.slice(-10);
        
        if (konamiCode.join(',') === konamiPattern.join(',')) {
            // Trigger easter egg animation
            document.body.style.animation = 'rainbow 2s linear infinite';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 5000);
        }
    });
    
    
    // ========================================
    // Performance: Lazy Load Images
    // ========================================
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        // Fallback for browsers that don't support lazy loading
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        document.body.appendChild(script);
    }
    
    
    // ========================================
    // Console Easter Egg
    // ========================================
    console.log('%c🎨 SketchAI - AI-Powered Image to Pencil Sketch', 
                'color: #60a5fa; font-size: 20px; font-weight: bold;');
    console.log('%cBuilt with ❤️ using Flask + OpenCV + Bootstrap', 
                'color: #a78bfa; font-size: 14px;');
    console.log('%cInterested in how it works? Check out /how-it-works', 
                'color: #64748b; font-size: 12px;');
    
});


// ========================================
// Add Rainbow Animation for Easter Egg
// ========================================
const style = document.createElement('style');
style.textContent = `
    @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
    }
`;
document.head.appendChild(style);


// ========================================
// Service Worker Registration (for PWA - optional)
// ========================================
if ('serviceWorker' in navigator) {
    // Uncomment to enable PWA functionality
    // navigator.serviceWorker.register('/sw.js')
    //     .then(reg => console.log('Service Worker registered', reg))
    //     .catch(err => console.log('Service Worker registration failed', err));
}