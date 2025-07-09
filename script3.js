// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取元素
    const fileInput = document.getElementById('fileInput');
    const exportBtn = document.getElementById('exportBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const fillerInput = document.getElementById('fillerInput');
    const cellBoxes = document.querySelectorAll('.cell-box');
    
    let currentCell = null;
    
    // 初始化
    init();
    
    function init() {
        // 加载保存的数据
        loadData();
        
        // 绑定事件
        bindEvents();
    }
    
    function bindEvents() {
        // 填表人输入事件
        fillerInput.addEventListener('input', saveData);
        
        // 为每个单元格绑定事件
        cellBoxes.forEach(cell => {
            const imageArea = cell.querySelector('.image-area');
            const titleDiv = cell.querySelector('.cell-title');
            const subtitleDiv = cell.querySelector('.cell-subtitle');
            const deleteBtn = cell.querySelector('.delete-btn');
            
            // 点击图片区域上传图片
            imageArea.addEventListener('click', function(e) {
                e.stopPropagation();
                currentCell = cell;
                fileInput.click();
            });
            
            // 拖拽事件
            imageArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('dragover');
            });
            
            imageArea.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
            });
            
            imageArea.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type.startsWith('image/')) {
                    currentCell = cell;
                    handleImageUpload(files[0]);
                }
            });
            
            // 删除按钮事件
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                deleteImage(cell);
            });
            
            // 文本输入事件
            titleDiv.addEventListener('input', saveData);
            subtitleDiv.addEventListener('input', saveData);
        });
        
        // 文件输入事件
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                handleImageUpload(e.target.files[0]);
            }
        });
        
        // 导出按钮事件
        exportBtn.addEventListener('click', exportImage);
        
        // 清空按钮事件
        clearAllBtn.addEventListener('click', clearAll);
    }
    
    function handleImageUpload(file) {
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件！');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            let img = currentCell.querySelector('.cell-image');
            if (!img) {
                img = document.createElement('img');
                img.className = 'cell-image visible';
                img.alt = '';
                currentCell.querySelector('.image-area').prepend(img);
            }
            img.src = e.target.result;
            img.classList.add('visible');
            currentCell.querySelector('.upload-overlay').classList.add('hidden');
            saveData();
            document.getElementById('fileInput').value = '';
        };
        reader.readAsDataURL(file);
    }
    
    function deleteImage(cell) {
        const img = cell.querySelector('.cell-image');
        const overlay = cell.querySelector('.upload-overlay');
        if (img) {
            img.remove();
        }
        overlay.classList.remove('hidden');
        saveData();
    }
    
    function saveData() {
        const data = {
            filler: fillerInput.value,
            cells: []
        };
        
        cellBoxes.forEach(cell => {
            const img = cell.querySelector('.cell-image');
            const titleDiv = cell.querySelector('.cell-title');
            const subtitleDiv = cell.querySelector('.cell-subtitle');
            
            data.cells.push({
                image: img && img.src ? img.src : '',
                title: titleDiv.innerText,
                subtitle: subtitleDiv.innerText
            });
        });
        
        localStorage.setItem('movieForm3Data', JSON.stringify(data));
    }
    
    function loadData() {
        const saved = localStorage.getItem('movieForm3Data');
        if (saved) {
            const data = JSON.parse(saved);
            
            if (data.filler !== undefined) {
                fillerInput.value = data.filler;
            }
            
            if (data.cells) {
                cellBoxes.forEach((cell, index) => {
                    const imageArea = cell.querySelector('.image-area');
                    let img = cell.querySelector('.cell-image');
                    const overlay = cell.querySelector('.upload-overlay');
                    if (img) img.remove();
                    if (data.cells[index] && data.cells[index].image) {
                        img = document.createElement('img');
                        img.className = 'cell-image visible';
                        img.alt = '';
                        img.src = data.cells[index].image;
                        imageArea.prepend(img);
                        overlay.classList.add('hidden');
                    } else {
                        overlay.classList.remove('hidden');
                    }
                });
            }
        }
    }
    
    function clearAll() {
        if (confirm('确定要清空所有内容吗？')) {
            // 清空所有图片和文本
            cellBoxes.forEach(cell => {
                const img = cell.querySelector('.cell-image');
                const overlay = cell.querySelector('.upload-overlay');
                const titleDiv = cell.querySelector('.cell-title');
                const subtitleDiv = cell.querySelector('.cell-subtitle');
                const defaultTitle = cell.getAttribute('data-default-title');
                const defaultSubtitle = cell.getAttribute('data-default-subtitle');
                
                if (img) img.remove();
                overlay.classList.remove('hidden');
                titleDiv.innerText = defaultTitle;
                subtitleDiv.innerText = defaultSubtitle;
            });
            
            // 重置填表人信息
            fillerInput.value = '';
            
            // 清空本地存储
            localStorage.removeItem('movieForm3Data');
        }
    }
    
    function exportImage() {
        showExportOverlay();
        setTimeout(() => {
            const controls = document.querySelector('.controls');
            if (controls) controls.style.display = 'none';
            const container = document.querySelector('.container');
            // 克隆container
            const exportContainer = container.cloneNode(true);
            exportContainer.classList.add('exporting');
            exportContainer.style.position = 'absolute';
            exportContainer.style.top = '-10000px';
            exportContainer.style.left = '-10000px';
            exportContainer.style.width = container.offsetWidth + 'px';
            exportContainer.style.background = '#fff';
            // 强制所有image-area宽高为200px
            exportContainer.querySelectorAll('.image-area').forEach(area => {
                area.style.width = '200px';
                area.style.height = '200px';
                area.style.maxWidth = 'none';
                area.style.aspectRatio = 'auto';
                area.style.margin = '0 auto';
            });
            // 强制grid gap
            const grid = exportContainer.querySelector('.grid-container');
            if (grid) grid.style.gap = '2px';
            // 隐藏所有删除按钮
            exportContainer.querySelectorAll('.delete-btn').forEach(btn => {
                btn.style.display = 'none';
            });
            // 同步填表人内容到span，并显示span隐藏input
            const fillerInput = container.querySelector('.filler-overlay-input');
            const fillerSpan = exportContainer.querySelector('.filler-export-text');
            if (fillerInput && fillerSpan) {
                fillerSpan.textContent = fillerInput.value;
                fillerSpan.style.display = 'inline';
                const inputInExport = exportContainer.querySelector('.filler-overlay-input');
                if (inputInExport) inputInExport.style.display = 'none';
            }
            document.body.appendChild(exportContainer);
            html2canvas(exportContainer, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true
            }).then(canvas => {
                try {
                    const link = document.createElement('a');
                    link.download = '电影之最印象表格.png';
                    link.href = canvas.toDataURL('image/png');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } catch (e) {
                    try {
                        window.open(canvas.toDataURL('image/png'));
                        alert('图片下载失败，请在新窗口中右键图片另存为。');
                    } catch (e2) {
                        alert('图片下载失败，请检查浏览器设置或尝试截图保存。');
                    }
                }
                if (controls) controls.style.display = '';
                document.body.removeChild(exportContainer);
                hideExportOverlay();
            }).catch(error => {
                alert('导出失败，请检查浏览器设置或尝试截图保存。');
                if (controls) controls.style.display = '';
                document.body.removeChild(exportContainer);
                hideExportOverlay();
            });
        }, 100);
    }
    
    function showExportOverlay() {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.id = 'exportOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
            font-size: 24px;
            font-weight: bold;
        `;
        overlay.textContent = '正在导出图片...';
        document.body.appendChild(overlay);
    }
    
    function hideExportOverlay() {
        const overlay = document.getElementById('exportOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
});