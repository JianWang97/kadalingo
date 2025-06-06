import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';

export const Counter: React.FC = () => {
  const [count, setCount] = useState(0);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(0);

  return (
    <Card title="🔢 计数器示例">
      <div className="text-center">
        <div className="text-6xl font-bold text-blue-500 mb-6">
          {count}
        </div>
        
        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={decrement} variant="secondary" size="sm">
            -1
          </Button>
          <Button onClick={increment} size="sm">
            +1
          </Button>
          <Button onClick={reset} variant="danger" size="sm">
            重置
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          这是一个简单的计数器组件示例，展示了状态管理和事件处理。
        </p>
      </div>
    </Card>
  );
};

export default Counter;
