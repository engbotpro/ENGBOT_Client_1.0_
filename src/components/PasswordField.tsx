import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import React, { useState } from "react";

interface PasswordFieldInterface {
	password: string;
	setPassword: React.Dispatch<React.SetStateAction<string>>;
	onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void; // Adiciona onKeyDown como opcional
  }
  
  function PasswordField({ password, setPassword, onKeyDown }: PasswordFieldInterface) {
	const [showPassword, setShowPassword] = useState(false);
  
	const handleClick = () => {
	  setShowPassword(!showPassword);
	};
  
	return (
	  <TextField
		margin="normal"
		variant="outlined"
		id="password"
		label="Password"
		sx={{ width: "70%" }}
		type={showPassword ? "text" : "password"}
		value={password}
		onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
		  setPassword(event.target.value);
		}}
		onKeyDown={onKeyDown} // Usa onKeyDown se fornecido
		inputProps={{ minLength: 6 }}
		required
		InputProps={{
		  endAdornment: (
			<InputAdornment position="end">
			  <IconButton onClick={handleClick} onMouseDown={(e) => e.preventDefault()}>
				{showPassword ? <VisibilityOff /> : <Visibility />}
			  </IconButton>
			</InputAdornment>
		  ),
		}}
	  />
	);
  }
  
  export default PasswordField;
