import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Layout } from './Layout';

describe('Layout', () => {
  it('컴포넌트가 렌더링된다', () => {
    render(
      <Layout>
        <div>테스트 컨텐츠</div>
      </Layout>
    );

    expect(screen.getByText('Billo-Billo')).toBeInTheDocument();
  });

  it('헤더를 표시한다', () => {
    render(
      <Layout>
        <div>테스트 컨텐츠</div>
      </Layout>
    );

    expect(screen.getByText('Billo-Billo')).toBeInTheDocument();
    expect(screen.getByText('AI 세무 비서')).toBeInTheDocument();
  });

  it('자식 요소를 렌더링한다', () => {
    render(
      <Layout>
        <div>테스트 컨텐츠</div>
      </Layout>
    );

    expect(screen.getByText('테스트 컨텐츠')).toBeInTheDocument();
  });
});
