import { IDataRepository } from '../interfaces/dataRepository';
import { IndexedDBRepository } from './indexedDBRepository';

// 存储类型枚举
export enum StorageType {
  INDEXEDDB = 'indexeddb',
}

// 存储配置接口
export interface StorageConfig {
  type: StorageType;
  config?: {
    // SQLite 配置
    dbPath?: string;
    
    // UniCloud 配置
    spaceId?: string;
    clientSecret?: string;
    endpoint?: string;
    
    // 通用配置
    maxRetries?: number;
    timeout?: number;
  };
}

// 仓库工厂类
export class RepositoryFactory {
  private static instance: RepositoryFactory;
  private repositories: Map<StorageType, IDataRepository> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory();
    }
    return RepositoryFactory.instance;
  }

  // 创建数据仓库实例
  public async createRepository(config: StorageConfig): Promise<IDataRepository> {
    const { type } = config;
      // 如果已经创建过相同类型的仓库，返回缓存的实例
    const existingRepo = this.repositories.get(type);
    if (existingRepo) {
      return existingRepo;
    }    let repository: IDataRepository;
    
    switch (type) {
      
      case StorageType.INDEXEDDB: {
        repository = new IndexedDBRepository();
        break;
      }
        
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }

    // 初始化仓库
    await repository.initialize();
    
    // 缓存实例
    this.repositories.set(type, repository);
    
    return repository;
  }

  // 获取已创建的仓库实例
  public getRepository(type: StorageType): IDataRepository | undefined {
    return this.repositories.get(type);
  }

  // 清理所有仓库连接
  public async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.repositories.values()).map(repo => 
      repo.cleanup ? repo.cleanup() : Promise.resolve()
    );
    
    await Promise.all(cleanupPromises);
    this.repositories.clear();
  }
}

// 默认存储配置
export const defaultStorageConfig: StorageConfig = {
  type: StorageType.INDEXEDDB, // 改为使用 IndexedDB 作为默认存储
  config: {
    maxRetries: 3,
    timeout: 5000,
  }
};



// 根据环境获取配置
export function getStorageConfig(): StorageConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    default:
      return defaultStorageConfig;
  }
}
