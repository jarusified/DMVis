import { Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

const useStyles = makeStyles((theme) => ({
	scroll: {
		height: "100px",
		overflowY: "auto",
		overflowX: "hidden"
	}
}));

export default function MetadataWrapper() {
	const classes = useStyles();

	const topology = useSelector((store) => store.topology);

	useEffect(() => {
		
	}, [topology]);

	return (
		<Paper>
			<Typography variant="overline" style={{ fontWeight: "bold" }}>
				Hardware Topology
			</Typography>


		</Paper>
	);
}
