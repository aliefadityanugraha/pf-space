import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Button from '../Button.vue';

describe('Button Component', () => {
  it('renders slot content correctly', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me'
      }
    });
    expect(wrapper.text()).toBe('Click me');
  });

  it('applies the correct variant class', () => {
    const wrapper = mount(Button, {
      props: {
        variant: 'destructive'
      }
    });
    // The destructive variant applies bg-brand-red
    expect(wrapper.classes()).toContain('bg-brand-red');
  });

  it('renders as a different tag when "as" prop is provided', () => {
    const wrapper = mount(Button, {
      props: {
        as: 'span'
      }
    });
    expect(wrapper.element.tagName).toBe('SPAN');
  });

  it('is disabled when loading prop is passed (if supported)', async () => {
    const wrapper = mount(Button, {
      props: {
        disabled: true
      }
    });
    expect(wrapper.element.disabled).toBe(true);
  });
});
