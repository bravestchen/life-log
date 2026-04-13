// 主应用逻辑
class HealthLearningApp {
    constructor() {
        this.currentView = 'dashboard';
        this.currentFilter = 'all';
        this.currentDetailRecordId = null;

        this.initializeApp();
    }

    // 初始化应用
    initializeApp() {
        this.setupEventListeners();
        this.applyTheme();
        this.loadInitialView();
        this.updateDashboard();
        this.renderRecentRecords();
        this.setupCharts();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 导航菜单点击
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // 添加记录按钮
        document.getElementById('addRecordBtn').addEventListener('click', () => {
            this.showAddRecordModal();
        });

        // 快速记录按钮
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.showAddRecordModal(type);
            });
        });

        // 主题切换按钮
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // 记录类型切换
        document.getElementById('recordType').addEventListener('change', (e) => {
            this.toggleRecordFields(e.target.value);
        });

        // 星级评分
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', (e) => {
                const value = parseInt(e.currentTarget.dataset.value);
                this.setStarRating(value);
            });
        });

        // 表单提交
        document.getElementById('recordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRecordSubmit();
        });

        // 模态框关闭按钮
        document.querySelectorAll('.close-modal, .close-detail-modal, .close-data-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideAllModals();
            });
        });

        // 点击模态框背景关闭
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAllModals();
                }
            });
        });

        // 时间轴筛选
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.setTimelineFilter(filter);
            });
        });

        // 数据管理按钮
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.showExportData();
        });

        document.getElementById('importDataBtn').addEventListener('click', () => {
            this.showImportData();
        });

        document.getElementById('clearDataBtn').addEventListener('click', () => {
            if (confirm('确定要清除所有数据吗？此操作不可撤销。')) {
                dataManager.clearData();
                this.reloadAllViews();
                alert('数据已清除');
            }
        });

        // 设置默认记录时间为当前时间
        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        document.getElementById('recordDate').value = localDateTime;
    }

    // 切换视图
    switchView(view) {
        // 更新导航菜单
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.nav-item[data-view="${view}"]`).classList.add('active');

        // 更新内容区域
        document.querySelectorAll('.view').forEach(viewEl => {
            viewEl.classList.remove('active');
        });
        document.getElementById(`${view}View`).classList.add('active');

        this.currentView = view;

        // 加载特定视图的数据
        switch (view) {
            case 'timeline':
                this.renderTimeline();
                break;
            case 'learning':
                this.renderLearningRecords();
                break;
            case 'health':
                this.renderHealthRecords();
                break;
            case 'stats':
                this.updateCharts();
                break;
        }
    }

    // 切换主题
    toggleTheme() {
        const newTheme = dataManager.toggleTheme();
        document.documentElement.setAttribute('data-theme', newTheme);

        const icon = document.querySelector('#themeToggle i');
        icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // 应用主题
    applyTheme() {
        const theme = dataManager.getTheme();
        document.documentElement.setAttribute('data-theme', theme);

        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // 切换记录类型字段
    toggleRecordFields(type) {
        document.querySelectorAll('.type-fields').forEach(fields => {
            fields.style.display = 'none';
        });

        switch (type) {
            case 'learning':
                document.getElementById('learningFields').style.display = 'block';
                break;
            case 'exercise':
                document.getElementById('exerciseFields').style.display = 'block';
                break;
            case 'body':
                document.getElementById('bodyFields').style.display = 'block';
                break;
        }
    }

    // 设置星级评分
    setStarRating(value) {
        document.querySelectorAll('.star').forEach((star, index) => {
            if (index < value) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // 显示添加记录模态框
    showAddRecordModal(presetType = null) {
        // 重置表单
        document.getElementById('recordForm').reset();

        // 重置星级评分
        this.setStarRating(3);

        // 设置预设类型
        if (presetType) {
            let recordType = presetType;
            if (presetType === 'learning') recordType = 'learning';
            if (presetType === 'body') recordType = 'body';
            if (presetType === 'health') recordType = 'exercise'; // 健康记录默认显示运动

            document.getElementById('recordType').value = recordType;
            this.toggleRecordFields(recordType);
        } else {
            document.getElementById('recordType').value = '';
            this.toggleRecordFields('');
        }

        // 显示模态框
        document.getElementById('addRecordModal').classList.add('active');
    }

    // 隐藏所有模态框
    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.currentDetailRecordId = null;
    }

    // 处理记录提交
    handleRecordSubmit() {
        const type = document.getElementById('recordType').value;
        const date = document.getElementById('recordDate').value;

        let recordData = {
            type: type,
            date: date
        };

        // 根据类型收集数据
        switch (type) {
            case 'learning':
                recordData.title = document.getElementById('learningTitle').value;
                recordData.learningType = document.getElementById('learningType').value;
                recordData.duration = parseInt(document.getElementById('learningDuration').value);
                recordData.notes = document.getElementById('learningNotes').value;
                break;
            case 'exercise':
                recordData.exerciseType = document.getElementById('exerciseType').value;
                recordData.duration = parseInt(document.getElementById('exerciseDuration').value);
                recordData.intensity = parseInt(document.querySelectorAll('.star.active').length);
                recordData.notes = document.getElementById('exerciseNotes').value;
                break;
            case 'body':
                recordData.weight = parseFloat(document.getElementById('bodyWeight').value);
                recordData.sleep = parseFloat(document.getElementById('bodySleep').value);
                recordData.steps = parseInt(document.getElementById('bodySteps').value);
                recordData.notes = document.getElementById('bodyNotes').value;
                break;
        }

        // 添加记录
        const newRecord = dataManager.addRecord(recordData);

        // 隐藏模态框
        this.hideAllModals();

        // 更新UI
        this.updateDashboard();
        this.renderRecentRecords();

        // 如果当前视图相关，重新渲染
        if (this.currentView === 'timeline') {
            this.renderTimeline();
        } else if (this.currentView === 'learning' && type === 'learning') {
            this.renderLearningRecords();
        } else if (this.currentView === 'health' && (type === 'exercise' || type === 'body')) {
            this.renderHealthRecords();
        } else if (this.currentView === 'stats') {
            this.updateCharts();
        }

        // 显示成功消息
        this.showToast('记录添加成功！');
    }

    // 更新仪表板
    updateDashboard() {
        const stats = dataManager.getStats();

        document.getElementById('streakDays').textContent = stats.streak;
        document.getElementById('todayLearning').textContent = stats.todayLearning;
        document.getElementById('todayExercise').textContent = stats.todayExercise;
    }

    // 渲染最近记录
    renderRecentRecords() {
        const container = document.getElementById('recentRecordsList');
        const records = dataManager.getRecentRecords(5);

        if (records.length === 0) {
            container.innerHTML = '<div class="text-center">暂无记录，添加第一条记录吧！</div>';
            return;
        }

        container.innerHTML = records.map(record => this.createRecordCard(record)).join('');

        // 添加点击事件
        container.querySelectorAll('.record-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.showRecordDetail(records[index].id);
            });
        });
    }

    // 渲染时间轴
    renderTimeline() {
        const container = document.getElementById('timelineList');
        const records = dataManager.getAllRecords(this.currentFilter);

        if (records.length === 0) {
            container.innerHTML = '<div class="text-center">暂无记录，添加第一条记录吧！</div>';
            return;
        }

        let html = '';
        let currentDate = '';

        records.forEach(record => {
            const recordDate = new Date(record.date).toLocaleDateString('zh-CN');

            // 添加日期标题
            if (recordDate !== currentDate) {
                currentDate = recordDate;
                html += `<div class="timeline-date">${currentDate}</div>`;
            }

            html += this.createTimelineItem(record);
        });

        container.innerHTML = html;

        // 添加点击事件
        container.querySelectorAll('.record-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.showRecordDetail(records[index].id);
            });
        });
    }

    // 设置时间轴筛选
    setTimelineFilter(filter) {
        // 更新筛选按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.filter-btn[data-filter="${filter}"]`).classList.add('active');

        this.currentFilter = filter;
        this.renderTimeline();
    }

    // 渲染学习记录
    renderLearningRecords() {
        const container = document.getElementById('learningRecordsList');
        const records = dataManager.getRecordsByType('learning');

        if (records.length === 0) {
            container.innerHTML = '<div class="text-center">暂无学习记录</div>';
            return;
        }

        container.innerHTML = records.map(record => this.createRecordCard(record)).join('');

        // 添加点击事件
        container.querySelectorAll('.record-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.showRecordDetail(records[index].id);
            });
        });
    }

    // 渲染健康记录
    renderHealthRecords() {
        const container = document.getElementById('healthRecordsList');
        const records = dataManager.getAllRecords().filter(r => r.type === 'exercise' || r.type === 'body');

        if (records.length === 0) {
            container.innerHTML = '<div class="text-center">暂无健康记录</div>';
            return;
        }

        container.innerHTML = records.map(record => this.createRecordCard(record)).join('');

        // 添加点击事件
        container.querySelectorAll('.record-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.showRecordDetail(records[index].id);
            });
        });
    }

    // 创建记录卡片
    createRecordCard(record) {
        let title = '';
        let content = '';
        let icon = '';
        let typeClass = '';

        switch (record.type) {
            case 'learning':
                title = record.title || '学习记录';
                content = record.notes || `学习时长: ${record.duration}分钟`;
                icon = 'fas fa-book';
                typeClass = 'learning';
                break;
            case 'exercise':
                title = `${record.exerciseType || '运动'} - ${record.duration}分钟`;
                content = record.notes || `强度: ${record.intensity || 0}/5`;
                icon = 'fas fa-running';
                typeClass = 'exercise';
                break;
            case 'body':
                title = '身体数据记录';
                content = `体重: ${record.weight || '--'}kg | 睡眠: ${record.sleep || '--'}h | 步数: ${record.steps || '--'}`;
                icon = 'fas fa-weight';
                typeClass = 'body';
                break;
        }

        const date = new Date(record.date).toLocaleDateString('zh-CN');

        return `
            <div class="record-item">
                <div class="record-header">
                    <div>
                        <div class="record-title">${title}</div>
                        <div class="record-date">${date}</div>
                    </div>
                    <span class="record-type ${typeClass}">
                        <i class="${icon}"></i> ${record.type === 'learning' ? '学习' : record.type === 'exercise' ? '运动' : '身体'}
                    </span>
                </div>
                <div class="record-content">${content}</div>
            </div>
        `;
    }

    // 创建时间轴项目
    createTimelineItem(record) {
        const card = this.createRecordCard(record);
        return `<div class="timeline-item">${card}</div>`;
    }

    // 显示记录详情
    showRecordDetail(recordId) {
        const record = dataManager.getRecord(recordId);
        if (!record) return;

        this.currentDetailRecordId = recordId;
        const modal = document.getElementById('recordDetailModal');
        const title = document.getElementById('detailTitle');
        const content = document.getElementById('detailContent');

        let detailHtml = `
            <div class="record-detail">
                <div class="detail-header">
                    <span class="record-type ${record.type}">
                        ${record.type === 'learning' ? '学习记录' : record.type === 'exercise' ? '运动记录' : '身体数据'}
                    </span>
                    <div class="detail-date">
                        ${new Date(record.date).toLocaleString('zh-CN')}
                    </div>
                </div>
        `;

        switch (record.type) {
            case 'learning':
                detailHtml += `
                    <h3>${record.title || '学习记录'}</h3>
                    <div class="detail-info">
                        <p><strong>学习类型:</strong> ${this.getLearningTypeText(record.learningType)}</p>
                        <p><strong>学习时长:</strong> ${record.duration}分钟</p>
                        ${record.progress ? `<p><strong>进度:</strong> ${record.progress}%</p>` : ''}
                    </div>
                    ${record.notes ? `<div class="detail-notes"><strong>心得笔记:</strong><p>${record.notes}</p></div>` : ''}
                `;
                break;
            case 'exercise':
                detailHtml += `
                    <h3>${record.exerciseType || '运动'}记录</h3>
                    <div class="detail-info">
                        <p><strong>运动类型:</strong> ${record.exerciseType || '运动'}</p>
                        <p><strong>运动时长:</strong> ${record.duration}分钟</p>
                        <p><strong>强度感受:</strong> ${record.intensity || 0}/5</p>
                    </div>
                    ${record.notes ? `<div class="detail-notes"><strong>备注:</strong><p>${record.notes}</p></div>` : ''}
                `;
                break;
            case 'body':
                detailHtml += `
                    <h3>身体数据记录</h3>
                    <div class="detail-info">
                        ${record.weight ? `<p><strong>体重:</strong> ${record.weight}kg</p>` : ''}
                        ${record.sleep ? `<p><strong>睡眠时长:</strong> ${record.sleep}小时</p>` : ''}
                        ${record.steps ? `<p><strong>步数:</strong> ${record.steps}步</p>` : ''}
                    </div>
                    ${record.notes ? `<div class="detail-notes"><strong>备注:</strong><p>${record.notes}</p></div>` : ''}
                `;
                break;
        }

        detailHtml += `
                <div class="detail-meta">
                    <p><small>创建时间: ${new Date(record.createdAt).toLocaleString('zh-CN')}</small></p>
                    <p><small>最后更新: ${new Date(record.updatedAt).toLocaleString('zh-CN')}</small></p>
                </div>
            </div>
        `;

        title.textContent = record.type === 'learning' ? '学习记录详情' :
                           record.type === 'exercise' ? '运动记录详情' : '身体数据详情';
        content.innerHTML = detailHtml;

        // 设置删除按钮事件
        document.getElementById('deleteRecordBtn').onclick = () => {
            if (confirm('确定要删除这条记录吗？')) {
                dataManager.deleteRecord(recordId);
                this.hideAllModals();
                this.reloadAllViews();
                this.showToast('记录已删除');
            }
        };

        modal.classList.add('active');
    }

    // 获取学习类型文本
    getLearningTypeText(type) {
        const types = {
            'reading': '阅读',
            'course': '在线课程',
            'practice': '技能练习',
            'certificate': '考证',
            'other': '其他'
        };
        return types[type] || type;
    }

    // 设置图表
    setupCharts() {
        // 周数据图表
        this.weekChart = new Chart(document.getElementById('weekChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['学习', '运动'],
                datasets: [{
                    label: '时长 (分钟)',
                    data: [0, 0],
                    backgroundColor: [
                        'rgba(79, 70, 229, 0.7)',
                        'rgba(16, 185, 129, 0.7)'
                    ],
                    borderColor: [
                        'rgb(79, 70, 229)',
                        'rgb(16, 185, 129)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // 学习类型图表
        this.learningTypeChart = new Chart(document.getElementById('learningTypeChart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(79, 70, 229, 0.7)',
                        'rgba(99, 102, 241, 0.7)',
                        'rgba(129, 140, 248, 0.7)',
                        'rgba(165, 180, 252, 0.7)',
                        'rgba(196, 181, 253, 0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // 运动类型图表
        this.exerciseTypeChart = new Chart(document.getElementById('exerciseTypeChart').getContext('2d'), {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.7)',
                        'rgba(34, 211, 238, 0.7)',
                        'rgba(52, 211, 153, 0.7)',
                        'rgba(110, 231, 183, 0.7)',
                        'rgba(167, 243, 208, 0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // 更新图表
    updateCharts() {
        const stats = dataManager.getStats();

        // 更新周数据图表
        this.weekChart.data.datasets[0].data = [stats.weekLearning, stats.weekExercise];
        this.weekChart.update();

        // 更新学习类型图表
        const learningTypes = stats.learningTypes;
        this.learningTypeChart.data.labels = Object.keys(learningTypes).map(key =>
            this.getLearningTypeText(key)
        );
        this.learningTypeChart.data.datasets[0].data = Object.values(learningTypes);
        this.learningTypeChart.update();

        // 更新运动类型图表
        const exerciseTypes = stats.exerciseTypes;
        this.exerciseTypeChart.data.labels = Object.keys(exerciseTypes);
        this.exerciseTypeChart.data.datasets[0].data = Object.values(exerciseTypes);
        this.exerciseTypeChart.update();
    }

    // 显示导出数据
    showExportData() {
        const modal = document.getElementById('dataModal');
        const title = document.getElementById('dataModalTitle');
        const content = document.getElementById('dataModalContent');

        const data = dataManager.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        title.textContent = '导出数据';
        content.innerHTML = `
            <p>您的数据已准备好下载。点击下面的按钮下载JSON文件。</p>
            <a href="${url}" download="health-learning-data-${new Date().toISOString().split('T')[0]}.json" class="btn-primary">
                <i class="fas fa-download"></i> 下载数据文件
            </a>
            <div class="mt-4">
                <h4>数据预览:</h4>
                <pre style="background: var(--border-color); padding: 15px; border-radius: var(--border-radius); overflow: auto; max-height: 200px;">${data.slice(0, 1000)}...</pre>
            </div>
        `;

        modal.classList.add('active');
    }

    // 显示导入数据
    showImportData() {
        const modal = document.getElementById('dataModal');
        const title = document.getElementById('dataModalTitle');
        const content = document.getElementById('dataModalContent');

        title.textContent = '导入数据';
        content.innerHTML = `
            <p>选择之前导出的JSON文件来恢复数据。</p>
            <input type="file" id="importFile" accept=".json" class="form-control">
            <div class="form-actions mt-4">
                <button id="cancelImport" class="btn-secondary">取消</button>
                <button id="confirmImport" class="btn-primary" disabled>导入</button>
            </div>
            <div id="importMessage" class="mt-4" style="display: none;"></div>
        `;

        const fileInput = content.querySelector('#importFile');
        const confirmBtn = content.querySelector('#confirmImport');
        const cancelBtn = content.querySelector('#cancelImport');
        const messageDiv = content.querySelector('#importMessage');

        fileInput.addEventListener('change', (e) => {
            confirmBtn.disabled = !e.target.files.length;
        });

        confirmBtn.addEventListener('click', () => {
            const file = fileInput.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = dataManager.importData(e.target.result);

                if (result.success) {
                    messageDiv.innerHTML = `<p style="color: var(--secondary-color);">✅ 成功导入 ${result.count} 条记录</p>`;
                    messageDiv.style.display = 'block';

                    // 重新加载所有视图
                    setTimeout(() => {
                        this.reloadAllViews();
                        modal.classList.remove('active');
                    }, 1500);
                } else {
                    messageDiv.innerHTML = `<p style="color: var(--danger-color);">❌ 导入失败: ${result.error}</p>`;
                    messageDiv.style.display = 'block';
                }
            };
            reader.readAsText(file);
        });

        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.classList.add('active');
    }

    // 重新加载所有视图
    reloadAllViews() {
        this.updateDashboard();
        this.renderRecentRecords();

        switch (this.currentView) {
            case 'timeline':
                this.renderTimeline();
                break;
            case 'learning':
                this.renderLearningRecords();
                break;
            case 'health':
                this.renderHealthRecords();
                break;
            case 'stats':
                this.updateCharts();
                break;
        }
    }

    // 显示Toast消息
    showToast(message) {
        // 创建toast元素
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 12px 24px;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        // 3秒后移除
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // 加载初始视图
    loadInitialView() {
        this.switchView('dashboard');
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .timeline-date {
        font-weight: 600;
        color: var(--text-color);
        margin: 20px 0 10px;
        padding-left: 30px;
        position: relative;
    }

    .timeline-date::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        width: 20px;
        height: 20px;
        background: var(--primary-color);
        border-radius: 50%;
        transform: translateY(-50%);
    }

    .record-detail {
        background: var(--card-bg);
        padding: 20px;
        border-radius: var(--border-radius);
        border: 1px solid var(--border-color);
    }

    .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .detail-info p {
        margin: 10px 0;
    }

    .detail-notes {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
    }

    .detail-notes p {
        margin-top: 10px;
        line-height: 1.6;
    }

    .detail-meta {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid var(--border-color);
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
`;
document.head.appendChild(style);

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new HealthLearningApp();
});