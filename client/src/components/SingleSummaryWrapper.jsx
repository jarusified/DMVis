import { useTheme } from "@emotion/react";
import { Typography } from "@mui/material";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import makeStyles from "@mui/styles/makeStyles";
import React, { useEffect, useRef, useState } from "react";
import "react-medium-image-zoom/dist/styles.css";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { fetchEnsembleSummary } from "../actions";
import { COLORS, formatTimestamp } from "../helpers/utils";
import { formatDuration } from "../helpers/utils";
import CategoryLegend from "../ui/CategoryLegend";
import D3RadialBarGraph from "../ui/d3-radial-bar-graph";

const useStyles = makeStyles((theme) => ({
	svg: {
		height: "300px",
		overflowY: "auto",
		overflowX: "hidden"
	}
}));

export default function SingleSummaryWrapper() {
	const classes = useStyles();
	const theme = useTheme();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const style = {
		top: 30,
		right: 20,
		bottom: 10,
		left: 40,
		width: window.innerWidth / 3 - 10,
		height: window.innerHeight / 3 - 50,
	};

	const containerID = useRef("single-summary-view");
	const individualSummary = useSelector((store) => store.individualSummary);

	const sharedMemUtilization = useSelector(
		(store) => store.sharedMemUtilization
	);
	const blockUtilization = useSelector((store) => store.blockUtilization);
	const achievedOccupancy = useSelector((store) => store.achievedOccupancy);
	const ensembleSummary = useSelector((store) => store.ensembleSummary);
	const selectedExperiment = useSelector((store) => store.selectedExperiment);
	const timelineEnd = useSelector((store) => store.timelineEnd);
	const timelineStart = useSelector((store) => store.timelineStart);
	const [runtimeRange, setRuntimeRange] = useState([0, 0]);
	const [categoryColormap, setCategoryColormap] = useState([]);

	useEffect(() => {
		const barWidth = 50;
		const sampleCount = Math.floor(window.innerWidth / 3 / barWidth);
		dispatch(fetchEnsembleSummary(sampleCount));
	}, []);

	useEffect(() => {
		if (Object.keys(ensembleSummary).length > 0) {
			setRuntimeRange([
				formatTimestamp(ensembleSummary["runtime_range"][0], 0),
				formatTimestamp(ensembleSummary["runtime_range"][1], 0)
			]);
		}
	}, [ensembleSummary]);

	useEffect(() => {
		// TODO: Make this more reliable to not depend on individual summaries.
		if (Object.keys(individualSummary).length > 0) {
			const class_names =
				individualSummary[selectedExperiment]["classNames"];

			let colormap = [];
			for (let cls in class_names) {
				colormap.push({ key: cls, value: COLORS[class_names[cls]] });
			}
			setCategoryColormap(colormap);
		}
	}, [individualSummary]);

	return (
		<Grid container>
			<Card style={{ borderColor: "white" }}>
				<Grid item xs={4} p={1}>
					<Typography
						variant="overline"
						style={{
							margin: 10,
							fontWeight: "bold",
							fontSize: theme.text.fontSize
						}}
					>
						Summary
					</Typography>
				</Grid>
				{Object.keys(individualSummary).length > 0 ? (
					<Grid>
						<D3RadialBarGraph
							containerName={
								containerID.current +
								"-" +
								selectedExperiment.split(".")[0]
							}
							style={style}
							innerRadius={Math.min(style.width, style.height) / 3.5}
							outerRadius={Math.min(style.width, style.height) / 2}
							individualSummary={
								individualSummary[selectedExperiment]
							}
							ensembleSummary={ensembleSummary}
							withInnerCircle={false}
							withTicks={true}
							withLabels={true}
							withYAxis={false}
							withPlayFeature={true}
						/>
						<Grid container>
							<Grid item xs={6}>
								<CategoryLegend colormap={categoryColormap} />
							</Grid>
							<Grid item xs={6} justifyContent={"center"}>
								<Typography
									variant="caption"
									style={{
										fontSize: theme.text.fontSize
									}}
								>
									RUNTIME (s): {" "}
									<span style={{ color: theme.text.label }}>
										{formatDuration(
											timelineEnd,
											timelineStart,
											false
										)}
									</span>
								</Typography>
								<Typography> </Typography>
								<Typography
									variant="caption"
									style={{
										fontSize: theme.text.fontSize
									}}
								>
									DATA MOVEMENT (mb):  {"  "}
									<span style={{ color: theme.text.label }}>
										{768}
									</span>
								</Typography>
								<Typography> </Typography>
								<Typography
									variant="caption"
									style={{
										fontSize: theme.text.fontSize
									}}
								>
									MEMORY UTILIZATION (%): {"  "}
									<span style={{ color: theme.text.label }}>
										{blockUtilization}
									</span>
								</Typography>
								<Typography> </Typography>
								<Typography
									variant="caption"
									style={{
										fontSize: theme.text.fontSize
									}}
								>
									EST. GPU OCCUPANCY (%): {"  "}
									<span style={{ color: theme.text.label }}>
										{achievedOccupancy}
									</span>
								</Typography>
							</Grid>
						</Grid>
					</Grid>
				) : (
					<CircularProgress />
				)}
			</Card>
		</Grid>
	);
}
