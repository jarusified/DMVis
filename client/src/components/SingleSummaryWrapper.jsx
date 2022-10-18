import { Typography } from "@mui/material";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
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
	}
}));

export default function SingleSummaryWrapper() {
	const classes = useStyles();
	const theme = useTheme();
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const containerID = useRef("single-summary-view");
	const individualSummary = useSelector((store) => store.individualSummary);
	const ensembleSummary = useSelector((store) => store.ensembleSummary);
	const selectedExperiment = useSelector((store) => store.selectedExperiment);

	const [runtimeRange, setRuntimeRange] = useState([0, 0]);
	const [categoryColormap, setCategoryColormap] = useState([]);
	const [thisSummary, setThisSummary] = useState([]);

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
			const exp = Object.keys(individualSummary)[0];
			const class_names = individualSummary[exp]["class_names"];

			let colormap = [];
			for (let cls in class_names) {
				colormap.push({ key: cls, value: COLORS[class_names[cls]] });
			}
			setCategoryColormap(colormap);

			setThisSummary(individualSummary[selectedExperiment]);
		}
	}, [individualSummary]);

	return (
		<Grid container>
			<Grid item xs={12}>
				<LinearScaleLegend range={runtimeRange} />
				<CategoryLegend colormap={categoryColormap} />
			</Grid>
			{Object.keys(thisSummary).length > 0 ? (
				() => {
					const {
						data,
						groups,
						samples,
						max_ts,
						class_name,
						start_ts,
						end_ts
					} = individualSummary[selectedExperiment];

					const style = {
						top: 30,
						right: 20,
						bottom: 10,
						left: 40,
						width: window.innerWidth / 3,
						height: window.innerHeight / 3
					};
					return (
						<Grid
							item
							xs={4}
							pt={4}
							key={selectedExperiment.split(".")[0]}
						>
							<Card style={{ borderColor: "gray" }}>
								<D3RadialBarGraph
									containerName={
										containerID.current +
										"-" +
										selectedExperiment.split(".")[0]
									}
									style={style}
									xProp={samples}
									yProp={data}
									zProp={groups}
									maxY={max_ts}
									classNames={class_names}
									startTs={start_ts}
									endTs={end_ts}
									ensembleSummary={ensembleSummary}
								/>
							</Card>
						</Grid>
					);
				}
			) : (
				<CircularProgress />
			)}
		</Grid>
	);
}
