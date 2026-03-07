import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ErrorFallback } from './ErrorFallback';

describe('ErrorFallback', () => {
  const mockError = new Error('테스트 에러');
  const mockResetErrorBoundary = vi.fn();

  it('컴포넌트가 렌더링된다', () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);

    expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument();
  });

  it('에러 메시지를 표시한다', () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);

    expect(screen.getByText('테스트 에러')).toBeInTheDocument();
  });

  it('다시 시도 버튼을 표시한다', () => {
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);

    expect(screen.getByText('다시 시도')).toBeInTheDocument();
  });

  it('다시 시도 버튼 클릭 시 콜백을 호출한다', async () => {
    const user = userEvent.setup();
    render(<ErrorFallback error={mockError} resetErrorBoundary={mockResetErrorBoundary} />);

    const retryButton = screen.getByText('다시 시도');
    await user.click(retryButton);

    expect(mockResetErrorBoundary).toHaveBeenCalledTimes(1);
  });
});
