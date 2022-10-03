import { Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useTheme } from "@mui/material/styles";
import PropTypes from "prop-types";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import SwipeableViews from "react-swipeable-views";

import { UPDATE_TIMELINE_SUMMARY } from "../helpers/types";
import { fetchEventSummary } from "../actions";
import BackgroundSummaryWrapper from "./BackgroundSummaryWrapper";
import PerEventSummaryWrapper from "./PerEventSummaryWrapper";
import FilterEventsDropDown from "./FilterEventsDropDown";
import PerTimelineSummaryWrapper from "./PerTimelineSummaryWrapper";

const useStyles = makeStyles((theme) => ({
	tab: {
		color: "#000",
		background: "#fff"
	}
}));

function TabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`full-width-tabpanel-${index}`}
			aria-labelledby={`full-width-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</div>
	);
}

TabPanel.propTypes = {
	children: PropTypes.node,
	index: PropTypes.number.isRequired,
	value: PropTypes.number.isRequired
};

function a11yProps(index) {
	return {
		id: `full-width-tab-${index}`,
		"aria-controls": `full-width-tabpanel-${index}`
	};
}

export default function DetailedTabWrapper() {
	const classes = useStyles();
	const theme = useTheme();
	const dispatch = useDispatch();

	const [tabIndex, setTabIndex] = React.useState(0);
	const [open, setOpen] = React.useState(false);

	const timelineSummary = useSelector((store) => store.timelineSummary);

	const handleChange = (event, newTabIndex) => {
		setTabIndex(newTabIndex);
	};

	const handleChangeIndex = (index) => {
		setTabIndex(index);
	};

	const handleFilterChange = (value) => {
		setOpen(false);
		// Send a dispatch to update the event summary.
		dispatch({
			type: UPDATE_TIMELINE_SUMMARY,
			payload: value
		});
		const selected_groups = value.map((d) => d.group);
		dispatch(fetchEventSummary(selected_groups));
	};

	return (
		<Paper>
			<Grid container>
				<Grid item xs={6}>
					<Typography
						variant="overline"
						style={{ margin: 10, fontWeight: "bold", fontSize: theme.text.fontSize }}
					>
						Summary
					</Typography>
				</Grid>
				<Grid item xs={6} flex justifyContent="flex-end">
					{timelineSummary.length > 0 ? (
						<FilterEventsDropDown
							selectedValue={timelineSummary}
							open={open}
							propagateChange={handleFilterChange}
						/>
					) : (
						<></>
					)}
				</Grid>
			</Grid>
			<Box sx={{ bgcolor: "background.paper" }}>
				<AppBar position="static" sx={{ bgcolor: "#f1a340" }}>
					<Tabs
						value={tabIndex}
						className={classes.tab}
						onChange={handleChange}
						indicatorColor="#000"
						variant="fullWidth"
						aria-label="Aggregated detailed statistics"
					>
						<Tab label="Per-timeline" {...a11yProps(0)} />
						<Tab label="Per-event" {...a11yProps(1)} />
						{/* <Tab label="Per-epoch" {...a11yProps(2)} /> */}
					</Tabs>
				</AppBar>
				<SwipeableViews
					axis={theme.direction === "rtl" ? "x-reverse" : "x"}
					index={tabIndex}
					onChangeIndex={handleChangeIndex}
				>
					<TabPanel value={tabIndex} index={0} dir={theme.direction}>
						<PerTimelineSummaryWrapper />
					</TabPanel>
					<TabPanel value={tabIndex} index={1} dir={theme.direction}>
						<PerEventSummaryWrapper />
					</TabPanel>
					{/* <TabPanel value={tabIndex} index={2} dir={theme.direction}>
						<BackgroundSummaryWrapper />
					</TabPanel> */}
				</SwipeableViews>
			</Box>
		</Paper>
	);
}
