import { Typography } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import { useTheme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import React, { useEffect, useRef } from "react";
import "react-medium-image-zoom/dist/styles.css";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { fetchEnsembleSummary, fetchMetadata } from "../actions";
import D3RadialBarGraph from "../ui/d3-radial-bar-graph";

const useStyles = makeStyles((theme) => ({
	svg: {
		height: "300px",
		overflowY: "auto",
		overflowX: "hidden"
	}
}));

export default function EnsembleSummaryWrapper() {
	const classes = useStyles();
	const theme = useTheme();
	const dispatch = useDispatch();
	const navigate = useNavigate()

	const containerID = useRef("event-summary-view");
	const ensembleSummary = useSelector((store) => store.ensembleSummary);

	useEffect(() => {
			const barWidth = 50;
			const sampleCount = Math.floor((window.innerWidth / 3)/ barWidth);
			dispatch(fetchEnsembleSummary(sampleCount));
	}, []);

	function onClick(exp) {
		dispatch(fetchMetadata(exp));
		navigate("/dashboard");
	}

	return (
		<Grid container>
			{Object.keys(ensembleSummary).length > 0 ? (
				Object.keys(ensembleSummary).map((exp) => {
					const {
						data,
						groups,
						samples,
						max_ts,
						class_names,
						start_ts,
						end_ts
					} = ensembleSummary[exp];
					const style = {
						top: 30,
						right: 20,
						bottom: 10,
						left: 40,
						width: window.innerWidth / 3,
						height: window.innerHeight / 3
					};
					return (
						<Grid item xs={4} pt={4}  key={exp.split(".")[0]} onClick={() => onClick(exp)}>
							<D3RadialBarGraph
								containerName={
									containerID.current +
									"-" +
									exp.split(".")[0]
								}
								style={style}
								xProp={samples}
								yProp={data}
								zProp={groups}
								maxY={max_ts}
								classNames={class_names}
								startTs={start_ts}
								endTs={end_ts}
							/>
							<Typography
								align="center"
								display="block"
								variant="overline"
								style={{
									fontWeight: "bold",
									fontSize: theme.text.fontSize
								}}
							>
								{exp}
							</Typography>{" "}
						</Grid>
					);
				})
			) : (
				<CircularProgress />
			)}
		</Grid>
	);
}
