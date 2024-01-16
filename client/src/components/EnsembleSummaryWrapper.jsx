import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { Typography } from "@mui/material";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { styled } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import { interpolateBlues } from "d3-scale-chromatic";
import React, { useEffect, useRef, useState } from "react";
import "react-medium-image-zoom/dist/styles.css";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
	fetchEnsembleSummary,
	updateIndividualSummary,
	updateSelectedExperiment
} from "../actions";
import { COLORS, formatTimestamp } from "../helpers/utils";
import CategoryLegend from "../ui/CategoryLegend";
import LineGraphLegend from "../ui/LineGraphLegend";
import LinearScaleLegend from "../ui/LinearScaleLegend";
import D3RadialBarGraph from "../ui/d3-radial-bar-graph";

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
	"& .MuiToggleButtonGroup-grouped": {
		margin: theme.spacing(0.5),
		border: 0,
		"&.Mui-disabled": {
			border: 0
		},
		"&:not(:first-of-type)": {
			borderRadius: theme.shape.borderRadius
		},
		"&:first-of-type": {
			borderRadius: theme.shape.borderRadius
		}
	}
}));

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
	},
	card: {
		margin: "auto",
		transition: "0.3s",
		boxShadow: "0 8px 40px -12px rgba(0,0,0,0.3)",
		"&:hover": {
			boxShadow: "0 16px 70px -12.125px rgba(0,0,0,0.3)"
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
	const [toggle, setToggle] = useState("");
	const [compareMode, setCompareMode] = useState(false);
	const tempIndividualSummary = useRef(undefined);

	const TOGGLE_MODES = ["timestamp", "sort-runtime", "sort-dmv", "compare"];
	const handleChange = (event, newToggle) => {
		if (!TOGGLE_MODES.includes(newToggle)) {
			console.assert("Undefined toggle mode!");
		}

		switch (newToggle) {
			case "timestamp": {
				const sorted = Object.fromEntries(
					Object.entries(tempIndividualSummary.current).sort(
						([, a], [, b]) => a.startTs - b.startTs
					)
				);
				dispatch(updateIndividualSummary(sorted));
				break;
			}
			case "sort-runtime": {
				const sorted = Object.fromEntries(
					Object.entries(tempIndividualSummary.current).sort(
						([, a], [, b]) => b.dur - a.dur
					)
				);
				dispatch(updateIndividualSummary(sorted));
				break;
			}
			case "sort-dmv": {
				const sorted = Object.fromEntries(
					Object.entries(tempIndividualSummary.current).sort(
						([, a], [, b]) => a.dmv - b.dmv
					)
				);
				dispatch(updateIndividualSummary(sorted));
				break;
			}
			case "compare": {
				dispatch(
					updateIndividualSummary(ensembleSummary["rel_binning"])
				);
				break;
			}
		}

		setToggle(newToggle);
	};

	const style = {
		top: 30,
		right: 20,
		bottom: 10,
		left: 0,
		width: window.innerWidth / 3,
		height: window.innerHeight / 3
	};

	useEffect(() => {
		dispatch(fetchEnsembleSummary());
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
			if (tempIndividualSummary.current == undefined) {
				tempIndividualSummary.current = individualSummary;
			}
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
			<Grid item xs={6} p={1}>
				{Object.keys(individualSummary).length > 0 ? (
					<StyledToggleButtonGroup
						color="primary"
						value={toggle}
						exclusive
						onChange={handleChange}
						aria-label="Platform"
					>
						<ToggleButton value="timestamp">
							Sort (by timestamp)
						</ToggleButton>
						<ToggleButton value="sort-runtime">
							Sort (by runtime)
						</ToggleButton>
						<ToggleButton value="sort-dmv">
							Sort (by explicit data movement)
						</ToggleButton>
						<ToggleButton value="compare">
							Compare
						</ToggleButton>
					</StyledToggleButtonGroup>
				) : (
					<></>
				)}
			</Grid>
			<Grid item xs={6}>
				<LinearScaleLegend
					containerID={"ensemble-tab-legend"}
					range={runtimeRange}
					caption="Ensemble Runtime"
					interpolator={interpolateBlues}
				/>
				<CategoryLegend colormap={categoryColormap} />
				{/* <LineGraphLegend range={runtimeRange} /> */}
			</Grid>
			{Object.keys(individualSummary).length > 0 ? (
				Object.keys(individualSummary).map((exp) => {
					return (
						<Grid item xs={3} key={exp.split(".")[0]}>
							<Typography
								mt={0}
								align="center"
								variant="overline"
								display="block"
								sx={{
									fontSize: theme.text.fontSize,
									color: theme.text.label,
									cursor: "pointer"
								}}
							>
								{exp}
							</Typography>{" "}
							<Card
								className={classes.card}
								onClick={() => onClick(exp)}
							>
								<D3RadialBarGraph
									containerName={
										containerID.current +
										"-" +
										exp.split(".")[0]
									}
									style={style}
									individualSummary={individualSummary[exp]}
									innerRadius={
										Math.min(style.width, style.height) / 4.5
									}
									outerRadius={
										Math.min(style.width, style.height) / 2
									}
									ensembleSummary={ensembleSummary}
									withInnerCircle={true}
									withUtilization={false}
									withTicks={false}
									withYAxis={false}
									withPlayFeature={false}
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
