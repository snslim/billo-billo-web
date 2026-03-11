import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { StepRole } from './StepRole';

describe('StepRole', () => {
  it('컴포넌트가 렌더링된다', () => {
    const mockOnSelect = vi.fn();
    render(<StepRole onSelect={mockOnSelect} />);

    expect(screen.getByText(/어떤 입장에서 검토하시나요/i)).toBeInTheDocument();
  });

  it('공급자 버튼을 표시한다', () => {
    const mockOnSelect = vi.fn();
    render(<StepRole onSelect={mockOnSelect} />);

    expect(screen.getByText('공급자 (매출)')).toBeInTheDocument();
  });

  it('공급받는자 버튼을 표시한다', () => {
    const mockOnSelect = vi.fn();
    render(<StepRole onSelect={mockOnSelect} />);

    expect(screen.getByText('공급받는자 (매입)')).toBeInTheDocument();
  });

  it('공급자 버튼 클릭 시 콜백을 호출한다', async () => {
    const user = userEvent.setup();
    const mockOnSelect = vi.fn();
    render(<StepRole onSelect={mockOnSelect} />);

    const supplierButton = screen.getByText('공급자 (매출)');
    await user.click(supplierButton);

    expect(mockOnSelect).toHaveBeenCalledWith('supplier');
  });

  it('공급받는자 버튼 클릭 시 콜백을 호출한다', async () => {
    const user = userEvent.setup();
    const mockOnSelect = vi.fn();
    render(<StepRole onSelect={mockOnSelect} />);

    const receiverButton = screen.getByText('공급받는자 (매입)');
    await user.click(receiverButton);

    expect(mockOnSelect).toHaveBeenCalledWith('receiver');
  });
});
