import { Paper, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import makeStyles from "@mui/styles/makeStyles";
import { useTheme } from "@mui/material/styles";
import React, { useEffect } from "react";
import "react-medium-image-zoom/dist/styles.css";
import { useDispatch, useSelector } from "react-redux";

import { fetchTopology } from "../actions";

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

    const topology = useSelector((store) => store.topology);
    const selectedExperiment = useSelector((store) => store.selectedExperiment);

    useEffect(() => {
        if (selectedExperiment !== "" || topology.length == 0) {
            dispatch(fetchTopology());
        }
    }, [selectedExperiment]);

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
                        Summary
                    </Typography>
                </Grid>
            </Grid>
            <Grid>
                <svg width={window.innerWidth / 4}></svg>
            </Grid>
        </Paper>
    );
}
