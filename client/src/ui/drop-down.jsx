import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import React, { useState } from "react";

import { formatTimestamp } from "../helpers/utils";

const DROPDOWN_WIDTH = window.innerWidth / 5;
const ITEM_HEIGHT = 40;
const ITEM_PADDING_TOP = 4;
const MenuProps = {
	PaperProps: {
		sx: {
			maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
			width: DROPDOWN_WIDTH
		}
	},
	anchorOrigin: {
		vertical: "bottom",
		horizontal: "left"
	},
	transformOrigin: {
		vertical: "top",
		horizontal: "left"
	}
};

export default function DropDown(props) {
	let { onChange, data } = props;

	const [events, setEvents] = useState(
		data.map((s) => {
			return s.event;
		})
	);

	function sort_data(d) {
		let sorted = d.sort((a, b) => b.dur - a.dur);
		return sorted.map((e) => e.event);
	}

	const handleChange = (event) => {
		const {
			target: { value }
		} = event;

		// Propagate the change to the selectedValue.
		data = data.filter((d) => {
			return value.includes(d.event);
		});

		// Find what events are selected and sort them by duration.
		let events = typeof value === "string" ? value.split(",") : value;
		let sorted_events = sort_data(data, events);
		setEvents(sorted_events);
		onChange(data);
	};

	return (
		<FormControl
			sx={{ width: DROPDOWN_WIDTH }}
			variant="outlined"
			color="primary"
			size="small"
		>
			<InputLabel id="multiple-checkbox-label" sx={{ top: 50 }}>
				{props.heading}
			</InputLabel>
			<Select
				labelId="checkbox-label"
				id="checkbox"
				value={events}
				onChange={handleChange}
				input={<OutlinedInput label="Tag" />}
				MenuProps={MenuProps}
			>
				{data.map((value) => (
					<MenuItem key={value.event} value={value.event}>
						<ListItemText primary={value} />
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
}
