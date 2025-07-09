document.addEventListener('DOMContentLoaded', function() {
    // 常量定义
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    // 元素引用
    const fileInput = document.getElementById('fileInput');
    const gridContainer = document.querySelector('.grid-container');
    const titleInput = document.getElementById('titleInput');
    const exportBtn = document.getElementById('exportBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    // 状态变量
    let currentCell = null;
    
    // 初始化
    init();
    
    function init() {
        // 清除所有保存的数据，确保干净启动
        localStorage.removeItem('movieFormData');
        
        setupEventListeners();
        setupAutoSave();
        
        // 确保所有单元格都是初始状态
        ensureCleanState();
    }
    
    function ensureCleanState() {
        const cells = gridContainer.querySelectorAll('.cell-box');
        cells.forEach(cell => {
            const img = cell.querySelector('.cell-image');
            const text = cell.querySelector('.cell-text');
            const overlay = cell.querySelector('.upload-overlay');
            
            // 确保图片是隐藏的
            img.src = '';
            img.classList.remove('visible');
            overlay.classList.remove('hidden');
            
            // 确保文字是默认值
            const defaultText = cell.getAttribute('data-default-text');
            text.value = defaultText || '';
        });
    }
    
    function setupEventListeners() {
        // 文件选择监听
        fileInput.addEventListener('change', handleFileSelect);
        
        // 标题输入监听
        titleInput.addEventListener('input', saveTitle);
        
        // 按钮监听
        exportBtn.addEventListener('click', exportTable);
        clearAllBtn.addEventListener('click', clearAllData);
        
        // 为现有单元格设置监听器
        setupCellListeners();
    }
    
    function setupCellListeners() {
        const cells = gridContainer.querySelectorAll('.cell-box');
        cells.forEach(cell => {
            const imageArea = cell.querySelector('.image-area');
            const textInput = cell.querySelector('.cell-text');
            const deleteBtn = cell.querySelector('.delete-btn');
            
            // 图片上传监听
            imageArea.addEventListener('click', () => {
                currentCell = cell;
                fileInput.click();
            });
            
            // 拖拽上传
            imageArea.addEventListener('dragover', handleDragOver);
            imageArea.addEventListener('drop', handleDrop);
            imageArea.addEventListener('dragenter', handleDragEnter);
            imageArea.addEventListener('dragleave', handleDragLeave);
            
            // 删除按钮监听
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteImage(cell);
            });
            
            // 文本输入监听
            textInput.addEventListener('input', () => {
                saveData();
            });
        });
    }
    
    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && currentCell) {
            processFile(file, currentCell);
        }
        fileInput.value = '';
    }
    
    function processFile(file, cell) {
        if (!validateFile(file)) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = cell.querySelector('.cell-image');
            const overlay = cell.querySelector('.upload-overlay');
            
            img.src = e.target.result;
            img.classList.add('visible');
            overlay.classList.add('hidden');
            
            saveData();
        };
        reader.readAsDataURL(file);
    }
    
    function validateFile(file) {
        if (!ALLOWED_TYPES.includes(file.type)) {
            alert('请上传图片文件（JPG、PNG、GIF、WebP）');
            return false;
        }
        
        if (file.size > MAX_FILE_SIZE) {
            alert('图片大小不能超过5MB');
            return false;
        }
        
        return true;
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        e.target.closest('.image-area').classList.add('dragover');
    }
    
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.target.closest('.image-area').classList.remove('dragover');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const container = e.target.closest('.image-area');
        container.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const cell = container.closest('.cell-box');
            processFile(files[0], cell);
        }
    }
    
    function deleteImage(cell) {
        if (!confirm('确定要删除这张图片吗？')) return;
        
        const img = cell.querySelector('.cell-image');
        const overlay = cell.querySelector('.upload-overlay');
        
        img.src = '';
        img.classList.remove('visible');
        overlay.classList.remove('hidden');
        
        saveData();
    }
    
    function saveData() {
        const data = {
            title: titleInput.value,
            cells: []
        };
        
        const cells = gridContainer.querySelectorAll('.cell-box');
        cells.forEach(cell => {
            const img = cell.querySelector('.cell-image');
            const text = cell.querySelector('.cell-text');
            
            data.cells.push({
                image: img.src || '',
                text: text.value || ''
            });
        });
        
        localStorage.setItem('movieFormData', JSON.stringify(data));
    }
    
    function loadSavedData() {
        const savedData = localStorage.getItem('movieFormData');
        if (!savedData) return;
        
        try {
            const data = JSON.parse(savedData);
            
            if (data.title) {
                titleInput.value = data.title;
            }
            
            if (data.cells) {
                const cells = gridContainer.querySelectorAll('.cell-box');
                data.cells.forEach((cellData, index) => {
                    if (index < cells.length) {
                        const cell = cells[index];
                        const img = cell.querySelector('.cell-image');
                        const text = cell.querySelector('.cell-text');
                        const overlay = cell.querySelector('.upload-overlay');
                        
                        if (cellData.image) {
                            img.src = cellData.image;
                            img.classList.add('visible');
                            overlay.classList.add('hidden');
                        }
                        
                        if (cellData.text) {
                            text.value = cellData.text;
                        }
                    }
                });
            }
        } catch (e) {
            console.error('加载保存数据时出错:', e);
        }
    }
    
    function saveTitle() {
        saveData();
    }
    
    function setupAutoSave() {
        setInterval(saveData, 30000); // 每30秒自动保存
    }
    
    function exportTable() {
        // 创建一个遮罩层隐藏导出过程
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.fontSize = '18px';
        overlay.style.color = '#333';
        overlay.textContent = '正在导出图片...';
        document.body.appendChild(overlay);

        // 创建导出容器（在遮罩层下面）
        const exportContainer = document.createElement('div');
        exportContainer.style.position = 'absolute';
        exportContainer.style.top = '0';
        exportContainer.style.left = '0';
        exportContainer.style.width = '800px';
        exportContainer.style.height = 'auto';
        exportContainer.style.backgroundColor = 'white';
        exportContainer.style.padding = '30px';
        exportContainer.style.zIndex = '9998';
        exportContainer.style.fontFamily = '"SimSun", "宋体", serif';
        
        // 创建标题
        const title = document.createElement('h1');
        title.textContent = document.getElementById('titleInput').value || '电影生涯个人喜好表';
        title.style.textAlign = 'center';
        title.style.marginBottom = '40px';
        title.style.marginTop = '40px';
        title.style.fontSize = '32px';
        title.style.fontWeight = 'bold';
        title.style.color = '#000';
        title.style.margin = '40px 0 40px 0';
        title.style.fontFamily = '"SimSun", "宋体", serif';
        
        // 创建表格容器
        const gridContainer = document.createElement('div');
        gridContainer.style.display = 'grid';
        gridContainer.style.gridTemplateColumns = 'repeat(6, 1fr)';
        gridContainer.style.gridTemplateRows = 'repeat(5, 1fr)';
        gridContainer.style.gap = '4px';
        gridContainer.style.width = '100%';
        gridContainer.style.maxWidth = '800px';
        gridContainer.style.margin = '0 auto';
        
        // 复制所有单元格
        const originalCells = document.querySelectorAll('.cell-box');
        originalCells.forEach(originalCell => {
            const cell = document.createElement('div');
            cell.style.border = '2px solid #000';
            cell.style.backgroundColor = 'white';
            cell.style.display = 'flex';
            cell.style.flexDirection = 'column';
            cell.style.width = '100%';
            cell.style.height = '200px';
            
            // 图片区域
            const imageArea = document.createElement('div');
            imageArea.style.position = 'relative';
            imageArea.style.width = '100%';
            imageArea.style.height = '170px';
            imageArea.style.backgroundColor = 'white';
            imageArea.style.overflow = 'hidden';
            
            const originalImg = originalCell.querySelector('.cell-image');
            if (originalImg && originalImg.src && originalImg.classList.contains('visible')) {
                const img = document.createElement('img');
                img.src = originalImg.src;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                imageArea.appendChild(img);
            }
            
            // 文字区域
            const textArea = document.createElement('div');
            textArea.style.height = '30px';
            textArea.style.display = 'flex';
            textArea.style.alignItems = 'center';
            textArea.style.justifyContent = 'center';
            textArea.style.backgroundColor = 'white';
            textArea.style.borderTop = '2px solid #000';
            textArea.style.borderBottom = '2px solid #000';
            
            const text = document.createElement('div');
            const originalText = originalCell.querySelector('.cell-text');
            text.textContent = originalText ? originalText.value : '';
            text.style.textAlign = 'center';
            text.style.fontSize = '18px';
            text.style.color = '#000';
            text.style.fontWeight = 'bold';
            text.style.width = '100%';
            text.style.fontFamily = '"SimSun", "宋体", serif';
            
            textArea.appendChild(text);
            cell.appendChild(imageArea);
            cell.appendChild(textArea);
            gridContainer.appendChild(cell);
        });
        
        exportContainer.appendChild(title);
        exportContainer.appendChild(gridContainer);
        document.body.appendChild(exportContainer);
        
        // 等待渲染完成
        setTimeout(() => {
                         html2canvas(exportContainer, {
                 scale: 2,
                 useCORS: true,
                 allowTaint: true,
                 backgroundColor: '#ffffff',
                 logging: false,
                 width: 800,
                 height: exportContainer.offsetHeight,
                 x: 0,
                 y: 0
             }).then(canvas => {
                 // 创建下载链接直接下载图片
                 const link = document.createElement('a');
                 link.download = '电影生涯个人喜好表.png';
                 link.href = canvas.toDataURL('image/png');
                 
                 // 触发下载
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
                 
                                  // 清理
                 document.body.removeChild(exportContainer);
                 document.body.removeChild(overlay);
             }).catch(error => {
                 console.error('导出失败:', error);
                 alert('导出失败，请重试');
                 
                 // 清理
                 if (document.body.contains(exportContainer)) {
                     document.body.removeChild(exportContainer);
                 }
                 if (document.body.contains(overlay)) {
                     document.body.removeChild(overlay);
                 }
             });
        }, 300);
    }
    
    function clearAllData() {
        if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) return;
        
        // 清空标题
        titleInput.value = '电影生涯个人喜好表';
        
        // 清空所有单元格
        const cells = gridContainer.querySelectorAll('.cell-box');
        cells.forEach(cell => {
            const img = cell.querySelector('.cell-image');
            const text = cell.querySelector('.cell-text');
            const overlay = cell.querySelector('.upload-overlay');
            
            img.src = '';
            img.classList.remove('visible');
            overlay.classList.remove('hidden');
            
            const defaultText = cell.getAttribute('data-default-text');
            text.value = defaultText || '';
        });
        
        // 清空本地存储
        localStorage.removeItem('movieFormData');
        
        alert('所有数据已清空');
    }
}); 