import { Paper, Typography } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useTheme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import useEmblaCarousel from 'embla-carousel-react'

import { fetchEventSummary } from "../actions";
import { UPDATE_TIMELINE_SUMMARY } from "../helpers/types";
import FilterEventsDropDown from "../ui/FilterEventsDropDown";
import { TabPanel, a11yProps } from "../ui/tab-panel";
import CCTWrapper from "./CCTWrapper";
import PerEventSummaryWrapper from "./PerEventSummaryWrapper";
import PerTimelineSummaryWrapper from "./PerTimelineSummaryWrapper";

const useStyles = makeStyles((theme) => ({
	tab: {
		color: "#000",
		background: "#fff"
	}
}));

export default function ApplicationTabWrapper() {
	const classes = useStyles();
	const theme = useTheme();
	const dispatch = useDispatch();
	const [emblaRef] = useEmblaCarousel()

	const [tabIndex, setTabIndex] = React.useState(0);
	const [open, setOpen] = React.useState(false);

	const timelineSummary = useSelector((store) => store.timelineSummary);

	const handleChange = (event, newTabIndex) => {
		setTabIndex(newTabIndex);
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
				<Grid item xs={4}>
					<Typography
						variant="overline"
						style={{
							margin: 10,
							fontWeight: "bold",
							fontSize: theme.text.fontSize
						}}
					>
						Application
					</Typography>
				</Grid>
				<Grid item xs={4} flex justifyContent="flex-end">
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
						<Tab label="Calling Context Tree" {...a11yProps(2)} />
						<Tab label="Per-timeline" {...a11yProps(0)} />
						<Tab label="Per-event" {...a11yProps(1)} />
					</Tabs>
				</AppBar>
				<div ref={emblaRef}> 
					<TabPanel
						value={tabIndex}
						index={0}
						dir={theme.direction}
					>	
						<CCTWrapper />
					</TabPanel>
					<TabPanel value={tabIndex} index={1} dir={theme.direction}>
						<PerTimelineSummaryWrapper />
					</TabPanel>
					<TabPanel value={tabIndex} index={2} dir={theme.direction}>
						<PerEventSummaryWrapper />
					</TabPanel>
				</div>
			</Box>
		</Paper>
	);
}
