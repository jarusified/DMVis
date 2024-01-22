import { Paper, Typography } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useTheme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import { interpolateReds } from "d3-scale-chromatic";
import useEmblaCarousel from "embla-carousel-react";
import React from "react";

import LinearScaleLegend from "../ui/LinearScaleLegend";
import { TabPanel, a11yProps } from "../ui/tab-panel";
import DeviceDeviceCommunication from "./DeviceDeviceCommunication";
import HostDeviceCommunication from "./HostDeviceCommunication";

const useStyles = makeStyles((theme) => ({
	tab: {
		color: "#000",
		background: "#fff"
	}
}));

export default function CommunicationTabWrapper() {
	const classes = useStyles();
	const theme = useTheme();
	const [emblaRef] = useEmblaCarousel();

	const [tabIndex, setTabIndex] = React.useState(0);

	const handleChange = (event, newTabIndex) => {
		setTabIndex(newTabIndex);
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
						Communication
					</Typography>
				</Grid>
				<Grid item xs={4}>
					<LinearScaleLegend
						containerID="comm-tab-legend"
						range={[0, 756]}
						caption="Data moved (mb)"
						interpolator={interpolateReds}
					/>
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
					>
						<Tab label="host-device" {...a11yProps(0)} />
						<Tab label="device-device" {...a11yProps(1)} />
					</Tabs>
				</AppBar>
				<div ref={emblaRef}>
					<TabPanel value={tabIndex} index={0} dir={theme.direction}>
						<HostDeviceCommunication />
					</TabPanel>
					<TabPanel value={tabIndex} index={1} dir={theme.direction}>
						<DeviceDeviceCommunication />
					</TabPanel>
				</div>
			</Box>
		</Paper>
	);
}
