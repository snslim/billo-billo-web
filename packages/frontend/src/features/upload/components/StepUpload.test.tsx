import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { StepUpload } from './StepUpload';

global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('StepUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  const mockOnUpload = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnDemoSelect = vi.fn();

  it('파일이 없을 때 업로드 영역을 표시한다', () => {
    render(
      <StepUpload
        file={null}
        role="receiver"
        onUpload={mockOnUpload}
        onCancel={mockOnCancel}
        onDemoSelect={mockOnDemoSelect}
      />
    );

    expect(screen.getByText(/파일을 드래그/i)).toBeInTheDocument();
  });

  it('파일이 있을 때 파일명을 표시한다', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    render(
      <StepUpload
        file={mockFile}
        role="receiver"
        onUpload={mockOnUpload}
        onCancel={mockOnCancel}
        onDemoSelect={mockOnDemoSelect}
      />
    );

    expect(screen.getByText(/test\.jpg/)).toBeInTheDocument();
  });

  it('파일이 있을 때 이미지를 표시한다', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    render(
      <StepUpload
        file={mockFile}
        role="receiver"
        onUpload={mockOnUpload}
        onCancel={mockOnCancel}
        onDemoSelect={mockOnDemoSelect}
      />
    );

    expect(screen.getByAltText('업로드된 세금계산서')).toBeInTheDocument();
  });

  it('취소 버튼 클릭 시 콜백을 호출한다', async () => {
    const user = userEvent.setup();
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    render(
      <StepUpload
        file={mockFile}
        role="receiver"
        onUpload={mockOnUpload}
        onCancel={mockOnCancel}
        onDemoSelect={mockOnDemoSelect}
      />
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[0]);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
