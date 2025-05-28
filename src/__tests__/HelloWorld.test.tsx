import React from 'react';
import { render, screen } from '@testing-library/react';
import HelloWorld from '../components/HelloWorld';

describe('HelloWorld component', () => {
  it('renders hello world message', () => {
    render(<HelloWorld />);
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });
}); 