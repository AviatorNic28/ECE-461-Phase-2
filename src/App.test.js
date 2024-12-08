import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App Component Tests', () => {
  test('renders the app title', () => {
    render(<App />);
    const titleElement = screen.getByText(/ECE 461 Group 19 - Trustworthy Module Registry/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('renders the search bar', () => {
    render(<App />);
    const searchBar = screen.getByPlaceholderText(/Search existing modules/i);
    expect(searchBar).toBeInTheDocument();
  });

  test('allows input in the search bar', () => {
    render(<App />);
    const searchBar = screen.getByPlaceholderText(/Search existing modules/i);
    fireEvent.change(searchBar, { target: { value: 'Test Module' } });
    expect(searchBar.value).toBe('Test Module');
  });

  test('renders a download button in the test package', () => {
    render(<App />);
    const downloadButton = screen.getAllByText(/Download/i)[0]; // Use `getAllByText` to avoid matching multiple elements
    expect(downloadButton).toBeInTheDocument();
  });

  test('search button is clickable', () => {
    render(<App />);
    const searchButton = screen.getByText(/Search/i);
    fireEvent.click(searchButton);
    expect(searchButton).toBeEnabled();
  });
});
