import { Paper, Typography } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useTheme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import useEmblaCarousel from "embla-carousel-react";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { UPDATE_TIMELINE_SUMMARY } from "../helpers/types";
import { TabPanel, a11yProps } from "../ui/tab-panel";
import TopologyWrapper from "./TopologyWrapper";

const useStyles = makeStyles((theme) => ({
	tab: {
		color: "#000",
		background: "#fff"
	}
}));

export default function DetailedTabWrapper() {
	const classes = useStyles();
	const theme = useTheme();
	const dispatch = useDispatch();
	const [emblaRef] = useEmblaCarousel();

	const [tabIndex, setTabIndex] = React.useState(0);
	const [open, setOpen] = React.useState(false);

	const eventSummary = useSelector((store) => store.eventSummary);

	const handleChange = (event, newTabIndex) => {
		setTabIndex(newTabIndex);
	};

	return (
		<Paper>
			<Grid container>
				<Grid item xs={6}>
					<Typography
						variant="overline"
						style={{
							margin: 10,
							fontWeight: "bold",
							fontSize: theme.text.fontSize
						}}
					>
						Hardware
					</Typography>
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
						<Tab label="Topology" {...a11yProps(0)} />
						{/* <Tab label="Data Layout" {...a11yProps(1)} /> */}
					</Tabs>
				</AppBar>
				<div ref={emblaRef}>
					<TabPanel value={tabIndex} index={0} dir={theme.direction}>
						<TopologyWrapper />
					</TabPanel>
					{/* <TabPanel
						value={tabIndex}
						index={1}
						dir={theme.direction}
					></TabPanel> */}
				</div>
			</Box>
		</Paper>
	);
}
