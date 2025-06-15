# IndexedDB 数据仓库迁移指南

## 概述

本项目已成功将数据存储从内存存储迁移到 IndexedDB，以提供持久化数据存储能力。

## 主要变更

### 1. 新增 IndexedDB 仓库实现

- **文件**: `src/data/repositories/indexedDBRepository.ts`
- **功能**: 完整实现了 `IDataRepository` 接口，提供与 MemoryRepository 相同的 API
- **特点**: 
  - 支持持久化存储
  - 自动初始化数据库结构
  - 自动加载示例数据
  - 支持索引和查询优化

### 2. 更新仓库工厂

- **文件**: `src/data/repositories/RepositoryFactory.ts`
- **变更**: 
  - 新增 `StorageType.INDEXEDDB`
  - 默认存储类型改为 `INDEXEDDB`
  - 支持创建 IndexedDB 仓库实例

### 3. 数据库结构

IndexedDB 数据库包含以下 Object Store：

```typescript
const STORES = {
  COURSES: "courses",           // 课程数据
  SENTENCES: "sentences",       // 句子数据
  LEARNING_PROGRESS: "learningProgress", // 学习进度
  METADATA: "metadata",         // 元数据（如下一个ID）
}
```

### 4. 索引设计

- **courses**: 按 category, difficulty, name 建立索引
- **sentences**: 按 difficulty 建立索引  
- **learningProgress**: 按 courseId 建立索引

## 如何使用

### 基本使用

```typescript
import { RepositoryFactory, StorageType } from '@/data';

// 获取 IndexedDB 仓库（默认）
const factory = RepositoryFactory.getInstance();
const repository = await factory.createRepository({
  type: StorageType.INDEXEDDB
});

// 使用仓库进行数据操作
const courses = await repository.getAllCourses();
```

### 切换回内存存储（如果需要）

```typescript
const repository = await factory.createRepository({
  type: StorageType.MEMORY
});
```

## 兼容性

- ✅ **API 兼容**: 完全兼容原有的 `IDataRepository` 接口
- ✅ **数据兼容**: 自动加载相同的示例数据
- ✅ **功能兼容**: 支持所有原有功能（CRUD、搜索、统计等）

## 测试

已提供测试工具来验证 IndexedDB 仓库的功能：

```typescript
import { testIndexedDB } from '@/utils/indexedDBTester';

// 在浏览器控制台中运行
await testIndexedDB();

// 或者在开发工具中调用
window.testIndexedDB();
```

## 优势

1. **持久化存储**: 数据在浏览器重启后仍然保存
2. **更大容量**: 比 localStorage 支持更大的数据量
3. **异步操作**: 不阻塞主线程
4. **事务支持**: 确保数据一致性
5. **索引查询**: 提供更好的查询性能

## 注意事项

1. **浏览器兼容性**: IndexedDB 在现代浏览器中有很好的支持
2. **错误处理**: 所有数据库操作都包含适当的错误处理
3. **数据迁移**: 首次使用时会自动创建数据库并加载示例数据
4. **清理资源**: 应用退出时会自动清理数据库连接

## 性能优化

- 使用事务来批量操作
- 合理利用索引进行查询
- 避免频繁的读写操作
- 适当使用缓存减少数据库访问

## 故障排除

如果遇到问题，可以：

1. 检查浏览器的开发者工具 > Application > Storage > IndexedDB
2. 运行测试工具验证功能
3. 查看控制台错误信息
4. 清除浏览器数据重新初始化

## 后续扩展

该架构支持后续添加更多存储类型：
- SQLite（通过 WebAssembly）
- 云端存储（如 Firebase、Supabase）
- 其他数据库解决方案
