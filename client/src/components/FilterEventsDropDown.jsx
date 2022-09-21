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

export default function FilterEventsDropDown(props) {
	let { propagateChange, selectedValue } = props;

	const [events, setEvents] = useState(
		selectedValue.map((s) => {
			return s.event;
		})
	);

	function sort_events_by_dur(selectedValue) {
		let sorted = selectedValue.sort((a, b) => b.dur - a.dur);
		return sorted.map((e) => e.event);
	}

	const handleChange = (event) => {
		const {
			target: { value }
		} = event;

		// Propogate the change to the selectedValue.
		selectedValue = selectedValue.filter((d) => {
			return value.includes(d.event);
		});

		// Find what events are selected and sort them by duration.
		let events = typeof value === "string" ? value.split(",") : value;
		let sorted_events = sort_events_by_dur(selectedValue, events);
		setEvents(sorted_events);

		propagateChange(selectedValue);
	};

	return (
		<FormControl
			sx={{ width: DROPDOWN_WIDTH }}
			variant="standard"
			size="small"
		>
			<InputLabel id="multiple-checkbox-label"></InputLabel>
			<Select
				labelId="multiple-checkbox-label"
				id="multiple-checkbox"
				multiple
				value={events}
				onChange={handleChange}
				input={<OutlinedInput label="Tag" />}
				renderValue={(events) => {
					return events.join(", ");
				}}
				MenuProps={MenuProps}
			>
				{selectedValue.map((value) => (
					<MenuItem key={value.event} value={value.event}>
						<Checkbox checked={events.indexOf(value.event) > -1} />
						<ListItemText
							primary={
								value.event +
								" : " +
								formatTimestamp(value.dur, 2) +
								"s"
							}
						/>
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
}
