// 数据存储和管理模块
class HealthLearningData {
    constructor() {
        this.STORAGE_KEY = 'health-learning-records';
        this.SETTINGS_KEY = 'health-learning-settings';
        this.loadData();
    }

    // 加载数据
    loadData() {
        try {
            const recordsJson = localStorage.getItem(this.STORAGE_KEY);
            this.records = recordsJson ? JSON.parse(recordsJson) : [];

            const settingsJson = localStorage.getItem(this.SETTINGS_KEY);
            this.settings = settingsJson ? JSON.parse(settingsJson) : {
                theme: 'light',
                streak: 0,
                lastRecordDate: null
            };
        } catch (error) {
            console.error('加载数据失败:', error);
            this.records = [];
            this.settings = { theme: 'light', streak: 0, lastRecordDate: null };
        }
    }

    // 保存数据
    saveData() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.records));
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    }

    // 添加记录
    addRecord(record) {
        const newRecord = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...record,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.records.unshift(newRecord); // 添加到开头，最新的在最前面

        // 更新连续记录天数
        this.updateStreak(newRecord.date);

        this.saveData();
        return newRecord;
    }

    // 更新连续记录天数
    updateStreak(recordDate) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const lastRecordDate = this.settings.lastRecordDate;

        if (recordDate === today) {
            if (!lastRecordDate) {
                this.settings.streak = 1;
            } else if (lastRecordDate === yesterday) {
                this.settings.streak++;
            } else if (lastRecordDate !== today) {
                this.settings.streak = 1;
            }
            this.settings.lastRecordDate = today;
        }

        this.saveData();
    }

    // 获取记录
    getRecord(id) {
        return this.records.find(record => record.id === id);
    }

    // 更新记录
    updateRecord(id, updates) {
        const index = this.records.findIndex(record => record.id === id);
        if (index !== -1) {
            this.records[index] = {
                ...this.records[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveData();
            return this.records[index];
        }
        return null;
    }

    // 删除记录
    deleteRecord(id) {
        const index = this.records.findIndex(record => record.id === id);
        if (index !== -1) {
            this.records.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    // 获取所有记录（可筛选）
    getAllRecords(filter = 'all') {
        if (filter === 'all') {
            return [...this.records];
        }
        return this.records.filter(record => record.type === filter);
    }

    // 获取今日记录
    getTodayRecords() {
        const today = new Date().toISOString().split('T')[0];
        return this.records.filter(record => {
            const recordDate = new Date(record.date).toISOString().split('T')[0];
            return recordDate === today;
        });
    }

    // 获取最近记录
    getRecentRecords(limit = 10) {
        return this.records.slice(0, limit);
    }

    // 按类型获取记录
    getRecordsByType(type) {
        return this.records.filter(record => record.type === type);
    }

    // 统计数据
    getStats() {
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = this.getTodayRecords();

        const todayLearning = todayRecords
            .filter(r => r.type === 'learning')
            .reduce((sum, r) => sum + (r.duration || 0), 0);

        const todayExercise = todayRecords
            .filter(r => r.type === 'exercise')
            .reduce((sum, r) => sum + (r.duration || 0), 0);

        // 本周数据（最近7天）
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        const weekRecords = this.records.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= weekAgo;
        });

        const weekLearning = weekRecords
            .filter(r => r.type === 'learning')
            .reduce((sum, r) => sum + (r.duration || 0), 0);

        const weekExercise = weekRecords
            .filter(r => r.type === 'exercise')
            .reduce((sum, r) => sum + (r.duration || 0), 0);

        // 学习类型分布
        const learningRecords = this.getRecordsByType('learning');
        const learningTypes = {};
        learningRecords.forEach(record => {
            const type = record.learningType || '其他';
            learningTypes[type] = (learningTypes[type] || 0) + 1;
        });

        // 运动类型分布
        const exerciseRecords = this.getRecordsByType('exercise');
        const exerciseTypes = {};
        exerciseRecords.forEach(record => {
            const type = record.exerciseType || '其他';
            exerciseTypes[type] = (exerciseTypes[type] || 0) + 1;
        });

        return {
            streak: this.settings.streak,
            todayLearning,
            todayExercise,
            weekLearning,
            weekExercise,
            totalRecords: this.records.length,
            learningTypes,
            exerciseTypes
        };
    }

    // 导出数据
    exportData() {
        const exportData = {
            records: this.records,
            settings: this.settings,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };
        return JSON.stringify(exportData, null, 2);
    }

    // 导入数据
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // 验证数据格式
            if (!data.records || !Array.isArray(data.records)) {
                throw new Error('无效的数据格式');
            }

            // 合并记录（避免ID冲突）
            data.records.forEach(record => {
                if (!this.records.some(r => r.id === record.id)) {
                    this.records.push(record);
                }
            });

            this.saveData();
            return { success: true, count: data.records.length };
        } catch (error) {
            console.error('导入数据失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 清除所有数据
    clearData() {
        this.records = [];
        this.settings = { theme: 'light', streak: 0, lastRecordDate: null };
        this.saveData();
    }

    // 切换主题
    toggleTheme() {
        this.settings.theme = this.settings.theme === 'light' ? 'dark' : 'light';
        this.saveData();
        return this.settings.theme;
    }

    // 获取当前主题
    getTheme() {
        return this.settings.theme || 'light';
    }

    // 生成示例数据（用于演示）
    generateSampleData() {
        const sampleRecords = [
            {
                id: 'sample1',
                type: 'learning',
                title: '阅读《深度工作》',
                learningType: 'reading',
                duration: 45,
                progress: 30,
                notes: '关于注意力管理的观点很受启发，计划每天实践深度工作法。',
                date: new Date(Date.now() - 86400000).toISOString(),
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 'sample2',
                type: 'exercise',
                exerciseType: 'running',
                duration: 30,
                intensity: 4,
                notes: '晨跑30分钟，感觉精力充沛，配速比上周有提升。',
                date: new Date(Date.now() - 86400000).toISOString(),
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 'sample3',
                type: 'body',
                weight: 65.5,
                sleep: 7.5,
                steps: 12500,
                notes: '睡眠质量不错，步数达标，体重保持稳定。',
                date: new Date(Date.now() - 2 * 86400000).toISOString(),
                createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 2 * 86400000).toISOString()
            },
            {
                id: 'sample4',
                type: 'learning',
                title: 'React Hooks教程',
                learningType: 'course',
                duration: 60,
                notes: '学习了useEffect和useContext的使用场景，对状态管理有了新理解。',
                date: new Date(Date.now() - 3 * 86400000).toISOString(),
                createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
            },
            {
                id: 'sample5',
                type: 'exercise',
                exerciseType: 'yoga',
                duration: 45,
                intensity: 3,
                notes: '瑜伽练习帮助放松身心，重点关注呼吸和姿势。',
                date: new Date(Date.now() - 4 * 86400000).toISOString(),
                createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
                updatedAt: new Date(Date.now() - 4 * 86400000).toISOString()
            }
        ];

        // 只添加示例数据如果当前没有记录
        if (this.records.length === 0) {
            this.records = sampleRecords;
            this.settings.streak = 3;
            this.settings.lastRecordDate = new Date().toISOString().split('T')[0];
            this.saveData();
            return sampleRecords.length;
        }
        return 0;
    }
}

// 创建全局数据实例
const dataManager = new HealthLearningData();

// 如果没有任何数据，生成示例数据
if (dataManager.records.length === 0) {
    dataManager.generateSampleData();
}