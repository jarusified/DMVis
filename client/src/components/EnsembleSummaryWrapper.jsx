import { Typography } from "@mui/material";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import React, { useEffect, useRef, useState } from "react";
import "react-medium-image-zoom/dist/styles.css";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { fetchEnsembleSummary, updateSelectedExperiment } from "../actions";
import { COLORS, formatTimestamp } from "../helpers/utils";
import CategoryLegend from "../ui/CategoryLegend";
import LinearScaleLegend from "../ui/LinearScaleLegend";
import D3RadialBarGraph from "../ui/d3-radial-bar-graph";

const useStyles = makeStyles((theme) => ({
	svg: {
		height: "300px",
		overflowY: "auto",
		overflowX: "hidden"
	},
	experimentSummary: {
		borderRadius: theme.spacing(1),
		backgroundColor: theme.palette.background,
		"&:hover": {
			backgroundColor: theme.palette.backgroundHighlight
		}
	}
}));

export default function EnsembleSummaryWrapper() {
	const classes = useStyles();
	const theme = useTheme();
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const containerID = useRef("ensemble-summary-view");
	const individualSummary = useSelector((store) => store.individualSummary);
	const ensembleSummary = useSelector((store) => store.ensembleSummary);

	const [runtimeRange, setRuntimeRange] = useState([0, 0]);
	const [categoryColormap, setCategoryColormap] = useState([]);

	const style = {
		top: 30,
		right: 20,
		bottom: 10,
		left: 40,
		width: window.innerWidth / 3,
		height: window.innerHeight / 3
	};

	useEffect(() => {
		const barWidth = 50;
		const sampleCount = Math.floor(window.innerWidth / 3 / barWidth);
		dispatch(fetchEnsembleSummary(sampleCount));
	}, []);

	function onClick(exp) {
		dispatch(updateSelectedExperiment(exp));
		navigate("/dashboard");
	}

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
			const exp = Object.keys(individualSummary)[0];
			const class_names = individualSummary[exp]["classNames"];

			let colormap = [];
			for (let cls in class_names) {
				colormap.push({ key: cls, value: COLORS[class_names[cls]] });
			}
			setCategoryColormap(colormap);
		}
	}, [individualSummary]);

	return (
		<Grid container justifyContent="center">
			<Grid item xs={12}>
				<LinearScaleLegend range={runtimeRange} />
				<CategoryLegend colormap={categoryColormap} />
			</Grid>
			{Object.keys(individualSummary).length > 0 ? (
				Object.keys(individualSummary).map((exp) => {
					return (
						<Grid
							item
							xs={4}
							key={exp.split(".")[0]}
							className={classes.experimentSummary}
						>
							<Typography
								mt={0}
								align="center"
								variant="overline"
								display="block"
								sx={{
									fontSize: theme.text.fontSize,
									color: theme.text.highlight,
									cursor: "pointer"
								}}
								onClick={() => onClick(exp)}
							>
								{exp}
							</Typography>{" "}
							<Card>
								<D3RadialBarGraph
									containerName={
										containerID.current +
										"-" +
										exp.split(".")[0]
									}
									style={style}
									individualSummary={individualSummary[exp]}
									ensembleSummary={ensembleSummary}
								/>
							</Card>
						</Grid>
					);
				})
			) : (
				<Grid container justifyContent="center">
					<CircularProgress />
				</Grid>
			)}
		</Grid>
	);
}
