import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

// Mock RTL utility
jest.mock('../../utils/rtl', () => ({
  rowDirection: () => 'row',
}));

describe('Button Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button title="Test Button" onPress={() => {}} />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Click Me" onPress={onPressMock} />);
    
    fireEvent.press(getByText('Click Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loading is true', () => {
    const { getByTestId, queryByText } = render(<Button title="Loading" onPress={() => {}} loading={true} />);
    
    // We expect the activity indicator to render instead of text in some designs, or both.
    // Based on the code, title is not rendered when loading.
    expect(queryByText('Loading')).toBeNull();
  });
});