import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Textarea,
} from '@chakra-ui/react';
import { useField } from 'formik';
import React from 'react';

type InputFieldProps = {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  textarea?: boolean;
};
export const InputField: React.FC<InputFieldProps> = props => {
  const [field, { error }] = useField(props);
  let InputOrTextarea;
  if (props.textarea) {
    InputOrTextarea = Textarea;
  } else {
    InputOrTextarea = Input;
  }
  return (
    <FormControl isInvalid={!!error}>
      <FormLabel htmlFor={field.name}>{props.label}</FormLabel>
      <InputOrTextarea
        type={props.type ?? 'text'}
        {...field}
        id={field.name}
        placeholder={props.placeholder}
      />
      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
};
