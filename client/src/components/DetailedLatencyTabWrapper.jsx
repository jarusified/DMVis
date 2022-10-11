import { Paper } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useTheme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import React from "react";
import { useDispatch } from "react-redux";
import SwipeableViews from "react-swipeable-views";

import { TabPanel, a11yProps } from "../ui/tab-panel";
import PerEventSummaryWrapper from "./PerEventSummaryWrapper";
import PerTimelineSummaryWrapper from "./PerTimelineSummaryWrapper";

const useStyles = makeStyles((theme) => ({
	tab: {
		color: "#000",
		background: "#fff"
	}
}));

export default function DetailedLatencyTabWrapper() {
	const classes = useStyles();
	const theme = useTheme();
	const dispatch = useDispatch();

	const [tabIndex, setTabIndex] = React.useState(0);

	const handleChange = (event, newTabIndex) => {
		setTabIndex(newTabIndex);
	};

	const handleChangeIndex = (index) => {
		setTabIndex(index);
	};

	return (
		<Paper>
			<Box sx={{ bgcolor: "background.paper" }}>
				<AppBar position="static" sx={{ bgcolor: "#f1a340" }}>
					<Tabs
						value={tabIndex}
						className={classes.tab}
						onChange={handleChange}
						indicatorColor="#000"
						variant="fullWidth"
						aria-label="Latency detailed statistics"
					>
						<Tab label="Per-timeline" {...a11yProps(0)} />
						<Tab label="Per-event" {...a11yProps(1)} />
						<Tab label="Calling Context Tree" {...a11yProps(2)} />
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
					<TabPanel value={tabIndex} index={2} dir={theme.direction}>
						{/* <CCTWrapper /> */}
					</TabPanel>
				</SwipeableViews>
			</Box>
		</Paper>
	);
}
